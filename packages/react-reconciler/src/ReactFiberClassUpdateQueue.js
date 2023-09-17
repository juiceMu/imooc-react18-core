import {
  markUpdateLaneFromFiberToRoot,
  enqueueConcurrentClassUpdate,
} from "./ReactFiberConcurrentUpdates";
import assign from "shared/assign";
import { NoLanes, mergeLanes, isSubsetOfLanes } from "./ReactFiberLane";

export const UpdateState = 0;

/**
 * 初始化Fiber节点的更新队列
 * @param {FiberNode} fiber 需要初始化更新队列的Fiber节点
 */
export function initialUpdateQueue(fiber) {
  const queue = {
    baseState: fiber.memoizedState, // 已经更新过的状态,也就是之前的pending更新队列的运行结果
    firstBaseUpdate: null, // 上一次更新完之后，剩余未执行的任务列队的头
    lastBaseUpdate: null, // 上一次更新完之后，剩余未执行的任务列队的尾巴
    shared: {
      pending: null, // 创建一个新的更新队列，其中pending是一个循环链表
    },
  };
  fiber.updateQueue = queue;
}

/**
 * 创建更新对象
 * @param {number} lane - 车道信息
 * @returns {Object} update - 返回一个新的更新对象
 */
export function createUpdate(lane) {
  const update = { tag: UpdateState, lane, next: null };
  return update;
}

/**
 * 将更新对象添加到Fiber节点的更新队列中
 * @param {Object} fiber 需要添加更新的Fiber对象
 * @param {Object} update 待添加的更新对象
 * @param {number} lane - 车道信息
 * @returns {Object} 更新后的fiber对象
 */
export function enqueueUpdate(fiber, update, lane) {
  const updateQueue = fiber.updateQueue;
  const sharedQueue = updateQueue.shared;
  return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
}

/**
 * 处理更新队列
 * @param {Object} workInProgress - 当前工作的fiber
 * @param {*} nextProps - 下一个属性集合
 * @param {*} renderLanes - 渲染车道
 */
export function processUpdateQueue(workInProgress, nextProps, renderLanes) {
  const queue = workInProgress.updateQueue;
  let firstBaseUpdate = queue.firstBaseUpdate; // 上一次更新完之后，剩余未执行的任务列队的头
  let lastBaseUpdate = queue.lastBaseUpdate; // 上一次更新完之后，剩余未执行的任务列队的尾巴
  const pendingQueue = queue.shared.pending; //queue.shared.pending始终是指向更新队列中的最新/最后的一个
  if (pendingQueue !== null) {
    // pendingQueue不为空证明存在更新任务
    // 如果有更新，则清空更新队列并开始计算新的状态
    // 需要将新更新对象和旧更新对象进行合并
    queue.shared.pending = null;
    const lastPendingUpdate = pendingQueue;
    const firstPendingUpdate = lastPendingUpdate.next; // 更新队列的头，即第一个
    // 把更新链表剪开，变成一个单链表
    lastPendingUpdate.next = null;
    if (lastBaseUpdate === null) {
      // 剩余未执行任务队列为空
      firstBaseUpdate = firstPendingUpdate;
    } else {
      // 剩余未执行任务队列不为空，则将新更新队列的头和剩余未执行任务队列(即旧更新队列)的尾部相接
      lastBaseUpdate.next = firstPendingUpdate;
    }
    // 新旧更新任务队列融合后，将旧任务队列指针指向队列的最后一个
    lastBaseUpdate = lastPendingUpdate;
  }
  if (firstBaseUpdate !== null) {
    let newState = queue.baseState;
    let newLanes = NoLanes;
    let newBaseState = null;
    let newFirstBaseUpdate = null;
    let newLastBaseUpdate = null;
    let update = firstBaseUpdate;
    do {
      const updateLane = update.lane;
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        // 如果判断该任务不在当前正在渲染的队列优先级内，则将该任进行存储
        const clone = {
          id: update.id,
          lane: updateLane,
          payload: update.payload,
        };
        if (newLastBaseUpdate === null) {
          newFirstBaseUpdate = newLastBaseUpdate = clone;
          newBaseState = newState;
        } else {
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        newLanes = mergeLanes(newLanes, updateLane);
      } else {
        if (newLastBaseUpdate !== null) {
          //15-9 Lane模型下的更新队列-3 这个判断可以再看该节课程理解
          const clone = {
            id: update.id,
            lane: 0,
            payload: update.payload,
          };
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        newState = getStateFromUpdate(update, newState);
      }
      update = update.next;
    } while (update);
    if (!newLastBaseUpdate) {
      newBaseState = newState;
    }
    queue.baseState = newBaseState;
    queue.firstBaseUpdate = newFirstBaseUpdate;
    queue.lastBaseUpdate = newLastBaseUpdate;
    workInProgress.lanes = newLanes;
    workInProgress.memoizedState = newState;
  }
}

/**
 * 根据更新计算新状态
 * @private
 * @param {Object} update - 更新对象
 * @param {*} prevState - 上一个状态
 * @param {*} nextProps - 下一个属性集合
 * @returns {*} 新的状态
 */
function getStateFromUpdate(update, prevState, nextProps) {
  switch (update.tag) {
    case UpdateState:
      const { payload } = update;
      let partialState;
      if (typeof payload === "function") {
        partialState = payload.call(null, prevState, nextProps);
      } else {
        partialState = payload;
      }
      return assign({}, prevState, partialState);
  }
}

/**
 * 克隆更新队列
 * @param {Object} current - 当前状态下的fiber对象
 * @param {Object} workInProgress - 正在工作的fiber对象
 */
export function cloneUpdateQueue(current, workInProgress) {
  const workInProgressQueue = workInProgress.updateQueue;
  const currentQueue = current.updateQueue;
  if (currentQueue === workInProgressQueue) {
    const clone = {
      baseState: currentQueue.baseState,
      firstBaseUpdate: currentQueue.firstBaseUpdate,
      lastBaseUpdate: currentQueue.lastBaseUpdate,
      shared: currentQueue.shared,
    };
    workInProgress.updateQueue = clone;
  }
}
