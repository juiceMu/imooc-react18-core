import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { createFiberFromElement, createFiberFromText } from "./ReactFiber";
import { Placement } from "./ReactFiberFlags";
import isArray from "shared/isArray";

/**
 * 创建Child Reconciler的函数
 * @param {boolean} shouldTrackSideEffects 是否需要跟踪副作用
 * @returns {function} reconcileChildFibers 用于处理子Fiber的函数
 */
function createChildReconciler(shouldTrackSideEffects) {
  /**
   * 将新创建的元素转换为Fiber
   * @param {Fiber} returnFiber 新的父Fiber
   * @param {Fiber} currentFirstFiber 老Fiber的第一个子Fiber
   * @param {object} element 新的子虚拟DOM元素
   * @returns {Fiber} created 返回新创建的Fiber
   */
  function reconcileSingleElement(returnFiber, currentFirstFiber, element) {
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  /**
   * 设置副作用
   * @param {Fiber} newFiber 新创建的Fiber
   * @returns {Fiber} newFiber 返回新创建的Fiber
   */
  function placeSingleChild(newFiber) {
    if (shouldTrackSideEffects) {
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  /**
   * 根据新的子节点创建Fiber
   * @param {Fiber} returnFiber 新的父Fiber
   * @param {object} newChild 新的子节点
   * @returns {Fiber | null} created 返回新创建的Fiber或null
   */
  function createChild(returnFiber, newChild) {
    if (
      (typeof newChild === "string" && newChild !== "") ||
      typeof newChild === "number"
    ) {
      const created = createFiberFromText(`${newChild}`);
      created.return = returnFiber;
      return created;
    }
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
        }
        default:
          break;
      }
    }
    return null;
  }

  /**
   * 为新创建的Fiber设置索引，并在必要时设置副作用
   * @param {Fiber} newFiber - 新创建的Fiber
   * @param {number} newIdx - 新的索引
   */
  function placeChild(newFiber, newIdx) {
    newFiber.index = newIdx;
    if (shouldTrackSideEffects) {
      newFiber.flags |= Placement;
    }
  }

  /**
   * 将新的子节点数组与旧的子Fiber进行比较，并返回新的子Fiber
   * @param {Fiber} returnFiber 新的父Fiber
   * @param {Fiber} currentFirstFiber 老Fiber第一个子Fiber
   * @param {Array} newChildren 新的子节点数组
   * @returns {Fiber} resultingFirstChild 返回新的子Fiber
   */
  function reconcileChildrenArray(returnFiber, currentFirstFiber, newChildren) {
    let resultingFirstChild = null;
    let previousNewFiber = null;
    let newIdx = 0;
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx]);
      if (newFiber === null) {
        continue;
      }
      placeChild(newFiber, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }

  /**
   * 比较子Fibers
   * @param {Fiber} returnFiber 新的父Fiber
   * @param {Fiber} currentFirstFiber 老Fiber的第一个子Fiber
   * @param {object} newChild 新的子虚拟DOM
   * @return {Fiber | null} result 返回新的子Fiber或null
   */
  function reconcileChildFibers(returnFiber, currentFirstFiber, newChild) {
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFirstFiber, newChild)
          );
        default:
          break;
      }
    }
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstFiber, newChild);
    }
    return null;
  }
  return reconcileChildFibers;
}

// 如果没有老父Fiber，即初次挂载时使用
export const mountChildFibers = createChildReconciler(false);
// 有老父Fiber更新时使用
export const reconcileChildFibers = createChildReconciler(true);
