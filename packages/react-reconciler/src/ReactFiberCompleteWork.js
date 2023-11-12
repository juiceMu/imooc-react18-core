import {
  createTextInstance,
  createInstance,
  appendInitialChild,
  finalizeInitialChildren,
  prepareUpdate,
} from "react-dom-bindings/src/client/ReactDOMHostConfig";
import { NoFlags, Update } from "./ReactFiberFlags";
import {
  HostComponent,
  HostRoot,
  HostText,
  FunctionComponent,
} from "./ReactWorkTags";

/**
 * 对fiber对象进行标记
 * @param {*} workInProgress
 */
function markUpdate(workInProgress) {
  workInProgress.flags |= Update;
}

/**
 * 更新常规组件
 * @param {Fiber} current 当前旧的Fiber节点
 * @param {Fiber} workInProgress 新建的Fiber节点
 * @param {*} type
 * @param {*} newProps
 */
function updateHostComponent(current, workInProgress, type, newProps) {
  const oldProps = current.memoizedProps; // 之前保存的属性
  const instance = workInProgress.stateNode;
  const updatePayload = prepareUpdate(instance, type, oldProps, newProps);
  workInProgress.updateQueue = updatePayload;
  if (updatePayload) {
    markUpdate(workInProgress);
  }
}

/**
 * 为完成的Fiber节点的父DOM节点添加所有子DOM节点
 * @param {DOM} parent 完成的Fiber节点对应的真实DOM节点
 * @param {Fiber} workInProgress 已完成的Fiber节点
 */
function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child; // 子fiber
  while (node) {
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      node = node.child;
      continue;
    }
    if (node === workInProgress) {
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    node = node.sibling;
  }
}

/**
 * 完成一个Fiber节点
 * @param {Fiber} current 当前旧的Fiber节点
 * @param {Fiber} workInProgress 新建的Fiber节点
 */
export function completeWork(current, workInProgress) {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case HostRoot:
      bubbleProperties(workInProgress);
      break;
    case HostComponent:
      const { type } = workInProgress;
      if (current !== null && workInProgress.stateNode !== null) {
        // 更新时
        updateHostComponent(current, workInProgress, type, newProps);
      } else {
        const instance = createInstance(type, newProps, workInProgress);
        appendAllChildren(instance, workInProgress);
        workInProgress.stateNode = instance;
        finalizeInitialChildren(instance, type, newProps);
      }
      bubbleProperties(workInProgress);
      break;
    case FunctionComponent:
      bubbleProperties(workInProgress);
      break;
    case HostText:
      const newText = newProps;
      workInProgress.stateNode = createTextInstance(newText);
      bubbleProperties(workInProgress);
      break;
  }
}

/**
 * 冒泡处理已完成Fiber节点的属性
 * @param {Fiber} completedWork 已完成的Fiber节点
 */
function bubbleProperties(completedWork) {
  let subtreeFlags = NoFlags;
  let child = completedWork.child;
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  // 将子节点的所有操作集合在父级节点上
  completedWork.subtreeFlags = subtreeFlags;
}
