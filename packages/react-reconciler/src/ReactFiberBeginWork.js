import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";
import { processUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import { shouldSetTextContent } from "react-dom-bindings/src/client/ReactDOMHostConfig";

/**
 * 根据新的虚拟DOM生成新的Fiber链表
 * @param {FiberNode} current 老的父Fiber节点
 * @param {FiberNode} workInProgress 新的Fiber节点
 * @param {*} nextChildren 新的子虚拟DOM
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  if (current === null) {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}

/**
 * 更新HostRoot类型的Fiber节点
 * @param {FiberNode} current 旧的Fiber节点
 * @param {FiberNode} workInProgress 新的Fiber节点
 * @returns {FiberNode} 新的子Fiber节点
 */
function updateHostRoot(current, workInProgress) {
  processUpdateQueue(workInProgress);
  const nextState = workInProgress.memoizedState;
  const nextChildren = nextState.element;
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 * 更新原生组件的Fiber节点并构建子Fiber链表
 * @param {FiberNode} current 旧的Fiber节点
 * @param {FiberNode} workInProgress 新的Fiber节点
 * @returns {FiberNode} 新的子Fiber节点
 */
function updateHostComponent(current, workInProgress) {
  const { type } = workInProgress;
  const nextProps = workInProgress.pendingProps;
  let nextChildren = nextProps.children;
  const isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    nextChildren = null;
  }
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 * 开始根据新的虚拟DOM构建新的Fiber子链表
 * @param {FiberNode} current 旧的Fiber节点
 * @param {FiberNode} workInProgress 新的Fiber节点
 * @returns {FiberNode|null} 新的子Fiber节点或者nul
 */
export function beginWork(current, workInProgress) {
  console.log("开始beginWork: ");
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
      return null;
    default:
      return null;
  }
}
