import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
} from "./ReactFiber";
import { Placement, ChildDeletion } from "./ReactFiberFlags";
import isArray from "shared/isArray";
import { HostText } from "./ReactWorkTags";

/**
 * 创建Child Reconciler的函数
 * @param {boolean} shouldTrackSideEffects 是否需要跟踪副作用
 * @returns {function} reconcileChildFibers 用于处理子Fiber的函数
 */
function createChildReconciler(shouldTrackSideEffects) {
  /**
   * 使用现有的Fiber节点和待处理的props创建新的Fiber节点
   * @param {Object} fiber 现有的fiber节点
   * @param {Object} pendingProps 待处理的props
   * @return {Object} clone 新的fiber节点
   */
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  /**
   * 将新创建的元素转换为Fiber
   * @param {Fiber} returnFiber 新的父Fiber
   * @param {Fiber} currentFirstChild 老Fiber的第一个子Fiber
   * @param {object} element 新的子虚拟DOM元素
   * @returns {Fiber} created 返回新创建的Fiber
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    const key = element.key;
    let child = currentFirstChild;
    while (child !== null) {
      if (child.key === key) {
        if (child.type === element.type) {
          deleteRemainingChildren(returnFiber, child.sibling);
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        } else {
          deleteRemainingChildren(returnFiber, child);
        }
      } else {
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  /**
   * 将子节点添加到待删除列表中
   * @param {Object} returnFiber 父级fiber节点
   * @param {Object} childToDelete 需要被删除的子fiber节点
   */
  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) return;
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      returnFiber.deletions.push(childToDelete);
    }
  }

  /**
   * 删除所有剩余的子节点
   * @param {Object} returnFiber 父级Fiber节点
   * @param {Object} currentFirstChild 当前的第一个子节点
   * @returns {null} 返回null
   */
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) return;
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }

  /**
   * 设置副作用
   * @param {Fiber} newFiber 新创建的Fiber
   * @returns {Fiber} newFiber 返回新创建的Fiber
   */
  function placeSingleChild(newFiber) {
    if (shouldTrackSideEffects) {
      // 这个逻辑主要是在更新的时候用
      // 更新时就会根据flags只要节点需要做哪些操作
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
   * 设置子Fiber节点的位置，并在必要的时候添加Placement标志
   * @param {Object} newFiber 新的子fiber节点
   * @param {number} lastPlacedIndex 最后一个被放置的节点的index
   * @param {number} newIdx - 新节点的index
   * @return {number} 返回最后一个被放置的节点的index
   */
  function placeChild(newFiber, lastPlacedIndex, newIdx) {
    newFiber.index = newIdx;
    if (!shouldTrackSideEffects) {
      return lastPlacedIndex;
    }
    const current = newFiber.alternate;
    if (current !== null) {
      const oldIndex = current.index;
      if (oldIndex < lastPlacedIndex) {
        newFiber.flags |= Placement;
        return lastPlacedIndex;
      } else {
        return oldIndex;
      }
    } else {
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    }
  }

  /**
   * 更新元素节点
   * @param {Object} returnFiber 父级Fiber节点
   * @param {Object} current 当前Fiber节点
   * @param {Object} element 新的React元素
   * @returns {Object} 返回一个更新后的Fiber节点
   */
  function updateElement(returnFiber, current, element) {
    const elementType = element.type;
    if (current !== null) {
      if (current.type === elementType) {
        const existing = useFiber(current, element.props);
        existing.return = returnFiber;
        return existing;
      }
    }
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  /**
   * 更新一个slot，如果新的子节点和旧的Fiber节点匹配，则返回更新后的Fiber节点，否则返回null
   * @param {Object} returnFiber 父级Fiber节点
   * @param {Object|null} oldFiber 旧的Fiber节点
   * @param {any} newChild 新的子节点
   * @return {Object|null} 返回一个更新后的Fiber节点，如果新的子节点和旧的Fiber节点不匹配，则返回null
   */
  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null;
    if (newChild !== null && typeof newChild === "object") {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          if (newChild.key === key) {
            return updateElement(returnFiber, oldFiber, newChild);
          }
        }
        default:
          return null;
      }
    }
    return null;
  }

  /**
   * 将剩余的子节点映射到一个Map对象中
   * @param {Object|null} returnFiber 父级Fiber节点
   * @param {Object|null} currentFirstChild 已经存在的子节点
   * @returns {Map|null} 返回一个Map对象，键是子节点的key，值是子节点的Fiber节点
   */
  function mapRemainingChildren(returnFiber, currentFirstChild) {
    const existingChildren = new Map();
    let existingChild = currentFirstChild;
    while (existingChild != null) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  }

  /**
   * 如果当前节点是文本节点则复用，否则创建新的文本节点。
   * @param {Fiber} returnFiber - 父级Fiber节点
   * @param {Fiber} current - 当前处理的Fiber节点
   * @param {string} textContent - 文本内容
   * @returns {Fiber} 新的或者复用的文本节点
   */
  function updateTextNode(returnFiber, current, textContent) {
    if (current === null || current.tag !== HostText) {
      const created = createFiberFromText(textContent);
      created.return = returnFiber;
      return created;
    } else {
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  }

  /**
   * 从现有的子节点映射中更新Fiber节点
   * @param {Map} existingChildren - 现有的子节点映射
   * @param {Fiber} returnFiber - 父级Fiber节点
   * @param {number} newIdx - 新节点的索引
   * @param {any} newChild - 新的子节点
   * @returns {Fiber} 更新后的Fiber节点
   */
  function updateFromMap(existingChildren, returnFiber, newIdx, newChild) {
    if (
      (typeof newChild === "string" && newChild !== "") ||
      typeof newChild === "number"
    ) {
      const matchedFiber = existingChildren.get(newIdx) || null;
      return updateTextNode(returnFiber, matchedFiber, "" + newChild);
    }
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const matchedFiber =
            existingChildren.get(
              newChild.key === null ? newIdx : newChild.key
            ) || null;
          return updateElement(returnFiber, matchedFiber, newChild);
        }
      }
    }
  }

  /**
   * 将新的子节点数组与旧的子Fiber进行比较，并返回新的子Fiber
   * @param {Fiber} returnFiber 新的父Fiber
   * @param {Fiber} currentFirstChild 老Fiber第一个子Fiber
   * @param {Array} newChildren 新的子节点数组
   * @returns {Fiber} resultingFirstChild 返回新的子Fiber，且只返回第一个子Fiber
   */
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let resultingFirstChild = null;
    let previousNewFiber = null;
    let newIdx = 0;
    let oldFiber = currentFirstChild;
    let nextOldFiber = null;
    let lastPlacedIndex = 0; // 复用的【最新的】的一个【旧的不用改变位置的Fiber节点】的索引值
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      nextOldFiber = oldFiber.sibling;
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx]);
      if (newFiber === null) {
        break;
      }
      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (newIdx === newChildren.length) {
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx]);
        if (newFiber === null) {
          continue;
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }

    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx]
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          if (newFiber.alternate !== null) {
            existingChildren.delete(
              newFiber.key === null ? newIdx : newFiber.key
            );
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }

    if (shouldTrackSideEffects) {
      existingChildren.forEach((child) => deleteChild(returnFiber, child));
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
