import {
  scheduleCallback as Scheduler_scheduleCallback,
  shouldYield,
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
} from "./Scheduler";

import {
  NoLane,
  NoLanes,
  getHighestPriorityLane,
  getNextLanes,
  includesBlockingLane,
  markRootUpdated,
} from "./ReactFiberLane";
import {
  getCurrentUpdatePriority,
  lanesToEventPriority,
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
} from "./ReactEventPriorities";
import { getCurrentEventPriority } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import {
  scheduleSyncCallback,
  flushSyncCallbacks,
} from "./ReactFiberSyncTaskQueue";

// 指向工作中的Fiber节点
let workInProgress = null;
let rootDoesHavePassiveEffect = false;
let rootWithPendingPassiveEffects = null;
const RootInProgress = 0;
const RootCompleted = 5;
let workInProgressRootExitStatus = RootInProgress;
let workInProgressRoot = null;
let workInProgressRenderLanes = NoLanes;
/**
 * 在Fiber上计划更新根节点
 * @param {*} root 根节点（FiberRoot）
 */
export function scheduleUpdateOnFiber(root, fiber, lane) {
  markRootUpdated(root, lane);
  ensureRootIsScheduled(root);
}

/**
 * 确保根节点被调度执行
 * @param {*} root 根节点
 */
function ensureRootIsScheduled(root) {
  const nextLanes = getNextLanes(root, NoLanes);
  if (nextLanes === NoLanes) {
    return;
  }
  let newCallbackPriority = getHighestPriorityLane(nextLanes);
  let newCallbackNode; // 调度任务返回的值，即任务对象
  if (newCallbackPriority === SyncLane) {
    // 同步渲染
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    queueMicrotask(flushSyncCallbacks);
    newCallbackNode = null;
  } else {
    // 异步渲染
    let schedulerPriorityLevel;
    // 根据优先级匹配事件优先级
    switch (lanesToEventPriority(nextLanes)) {
      case DiscreteEventPriority:
        schedulerPriorityLevel = ImmediateSchedulerPriority;
        break;
      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingSchedulerPriority;
        break;
      case DefaultEventPriority:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
      case IdleEventPriority:
        schedulerPriorityLevel = IdleSchedulerPriority;
        break;
      default:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
    }
    newCallbackNode = Scheduler_scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }
  root.callbackNode = newCallbackNode;
}

/**
 * 执行根节点上的并发工作
 * @param {*} root 根节点
 * @param {*} didTimeout 是否超时的标识
 */
function performConcurrentWorkOnRoot(root, didTimeout) {
  //先保存任务对象
  const originalCallbackNode = root.callbackNode;
  // 获取更新优先级
  const lanes = getNextLanes(root, NoLanes);
  if (lanes === NoLanes) {
    return null;
  }
  // 是否需要时间切片
  const shouldTimeSlice = !includesBlockingLane(root, lanes) && !didTimeout;
  // 退出状态
  const exitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes);
  if (exitStatus !== RootInProgress) {
    // 渲染过程执行完毕
    const finishedWork = root.current.alternate;
    root.finishedWork = finishedWork;
    // 把处理好的信息挂载到页面上
    commitRoot(root);
  }
  if (root.callbackNode === originalCallbackNode) {
    return performConcurrentWorkOnRoot.bind(null, root);
  }
  return null;
}

/**
 * 提交根节点。
 * @param {*} root - 根节点。
 */
function commitRoot(root) {
  const { finishedWork } = root;
  workInProgressRoot = null;
  workInProgressRenderLanes = null;
  if (
    (finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags
  ) {
    if (!rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = true;
      // 会等commitRoot这个函数都执行完毕之后，才会执行NormalSchedulerPriority, flushPassiveEffect，而不是走到这时，立即执行
      Scheduler_scheduleCallback(NormalSchedulerPriority, flushPassiveEffect);
    }
  }
  root.callbackNode = null;
  const subtreeHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;
  if (subtreeHasEffects || rootHasEffect) {
    commitMutationEffectsOnFiber(finishedWork, root);
    commitLayoutEffects(finishedWork, root);
    if (rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = false;
      rootWithPendingPassiveEffects = root;
    }
  }
  root.current = finishedWork;
}

/**
 * 准备一个新的工作栈
 * @param {*} root 根节点
 * @param {*} renderLanes 渲染优先级
 */
function prepareFreshStack(root, renderLanes) {
  // if (
  //   root !== workInProgressRoot ||
  //   workInProgressRenderLanes !== renderLanes
  // ) {
  workInProgress = createWorkInProgress(root.current, null);
  // }
  workInProgressRootRenderLanes = renderLanes;
  workInProgressRoot = root;
  finishQueueingConcurrentUpdates();
}

/**
 * 同步渲染根节点
 * @param {*} root 根节点
 * @param {*} renderLanes 渲染优先级
 */
function renderRootSync(root, renderLanes) {
  if (
    root !== workInProgressRoot ||
    workInProgressRootRenderLanes !== renderLanes
  ) {
    prepareFreshStack(root, renderLanes);
  }
  workLoopSync();
}

/**
 * 同步工作循环
 */
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

/**
 * 执行一个工作单元
 * @param {*} unitOfWork 工作单元，即Fiber节点
 */
function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate;
  const next = beginWork(current, unitOfWork, workInProgressRenderLanes);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
}

/**
 * 完成一个工作单元
 * @param {*} unitOfWork
 */
function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    completeWork(current, completedWork);
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted;
  }
}

function flushPassiveEffect() {
  if (rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects;
    commitPassiveUnmountEffects(root.current);
    commitPassiveMountEffects(root, root.current);
  }
}

/**
 * 获取lane值
 * @returns 如果存在lane就返回，否则返回事件优先级
 */
export function requestUpdateLane() {
  const updateLane = getCurrentUpdatePriority();
  if (updateLane !== NoLanes) {
    // 存在更新优先级就返回更新优先级
    return updateLane;
  }
  const eventLane = getCurrentEventPriority();
  return eventLane;
}

/**
 * 执行同步渲染
 * @param {*} root 根节点
 * @returns
 */
function performSyncWorkOnRoot(root) {
  const lanes = getNextLanes(root);
  renderRootSync(root, lanes);
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
  return null;
}

/**
 * 异步渲染
 * @param {*} root
 * @param {*} lanes
 * @returns
 */
function renderRootConcurrent(root, lanes) {
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    prepareFreshStack(root, lanes);
  }
  workLoopConcurrent();
  if (workInProgress !== null) {
    // 进入该判断代表还在处理中
    return RootInProgress;
  }
  return workInProgressRootExitStatus;
}

function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork();
  }
}
