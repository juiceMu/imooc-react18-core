import {
  HostComponent,
  HostRoot,
  HostText,
  FunctionComponent,
  IndeterminateComponent,
} from "./ReactWorkTags";
import { renderWithHooks } from "./ReactFiberHooks";
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
  // 判断子节点是否为文本
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
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      return mountIndeterminateComponent(
        current,
        workInProgress,
        workInProgress.type
      );
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case FunctionComponent:
      const Component = workInProgress.type;
      const nextProps = workInProgress.pendingProps;
      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        nextProps
      );
    case HostText:
      return null;
    default:
      return null;
  }
}

export function mountIndeterminateComponent(
  current,
  workInProgress,
  Component
) {
  const props = workInProgress.pendingProps;
  const value = renderWithHooks(current, workInProgress, Component, props);
  workInProgress.tag = FunctionComponent;
  reconcileChildren(current, workInProgress, value);
  return workInProgress.child;
}

/**
 * 更新函数组件
 * @param {FiberNode} current 旧的Fiber节点
 * @param {FiberNode} workInProgress 新的Fiber节点
 * @param {*} Component 组件
 * @param {*} nextProps
 * @returns 返回子节点
 */
export function updateFunctionComponent(
  current,
  workInProgress,
  Component,
  nextProps
) {
  const nextChildren = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps
  );
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}
