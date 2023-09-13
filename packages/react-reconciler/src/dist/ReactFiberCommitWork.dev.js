"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.commitMutationEffectsOnFiber = commitMutationEffectsOnFiber;
exports.commitPassiveUnmountEffects = commitPassiveUnmountEffects;
exports.commitPassiveMountEffects = commitPassiveMountEffects;
exports.commitLayoutEffects = commitLayoutEffects;

var _ReactDOMHostConfig = require("react-dom-bindings/src/client/ReactDOMHostConfig");

var _ReactFiberFlags = require("./ReactFiberFlags");

var _ReactWorkTags = require("./ReactWorkTags");

var _ReactHookEffectTags = require("./ReactHookEffectTags");

/**
 * 递归遍历所有子节点并在每个Fiber上应用mutation副作用
 * @param {Fiber} root Fiber树的根节点
 * @param {Fiber} parentFiber 当前Fiber节点的父节点
 */
function recursivelyTraverseMutationEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & _ReactFiberFlags.MutationMask) {
    var child = parentFiber.child;

    while (child !== null) {
      commitMutationEffectsOnFiber(child, root);
      child = child.sibling;
    }
  }
}
/**
 * 应用Fiber节点上的调和副作用
 * @param {Fiber} finishedWork 已完成的工作单位，即Fiber节点
 */


function commitReconciliationEffects(finishedWork) {
  var flags = finishedWork.flags;

  if (flags & _ReactFiberFlags.Placement) {
    commitPlacement(finishedWork);
    finishedWork.flags &= ~_ReactFiberFlags.Placement;
  }
}
/**
 * 判断是否为宿主父节点
 * @param {Fiber} fiber Fiber节点
 * @returns {Boolean} 是宿主父节点则返回true，否则返回false
 */


function isHostParent(fiber) {
  return fiber.tag === _ReactWorkTags.HostComponent || fiber.tag == _ReactWorkTags.HostRoot;
}
/**
 * 获取fiber节点的宿主父节点
 * @param {Fiber} fiber - fiber节点
 * @returns {Fiber} fiber节点的宿主父节点
 */


function getHostParentFiber(fiber) {
  var parent = fiber["return"];

  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }

    parent = parent["return"];
  }
}
/**
 * 获取宿主兄弟节点
 * @param {Fiber} fiber - fiber节点
 * @returns {Node|null} 如果存在宿主兄弟节点则返回，否则返回null
 */


function getHostSibling(fiber) {
  var node = fiber;

  sibling: while (true) {
    while (node.sibling === null) {
      if (node["return"] === null || isHostParent(node["return"])) {
        return null;
      }

      node = node["return"];
    }

    node = node.sibling;

    while (node.tag !== _ReactWorkTags.HostComponent && node.tag !== _ReactWorkTags.HostText) {
      if (node.flags & _ReactFiberFlags.Placement) {
        continue sibling;
      } else {
        node = node.child;
      }
    }

    if (!(node.flags & _ReactFiberFlags.Placement)) {
      return node.stateNode;
    }
  }
}
/**
 * 将节点插入或附加到父节点
 * @param {Fiber} node fiber节点
 * @param {Node} before 参考节点
 * @param {Node} parent 父节点
 */


function insertOrAppendPlacementNode(node, before, parent) {
  var tag = node.tag;
  var isHost = tag === _ReactWorkTags.HostComponent || tag === _ReactWorkTags.HostText;

  if (isHost) {
    var stateNode = node.stateNode;

    if (before) {
      (0, _ReactDOMHostConfig.insertBefore)(parent, stateNode, before);
    } else {
      (0, _ReactDOMHostConfig.appendChild)(parent, stateNode);
    }
  } else {
    var child = node.child;

    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      var sibling = child.sibling;

      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}
/**
 * 提交位置
 * @param {Fiber} finishedWork 已完成的工作单位，即Fiber节点
 */


function commitPlacement(finishedWork) {
  var parentFiber = getHostParentFiber(finishedWork);

  switch (parentFiber.tag) {
    case _ReactWorkTags.HostRoot:
      {
        var parent = parentFiber.stateNode.containerInfo;
        var before = getHostSibling(finishedWork);
        insertOrAppendPlacementNode(finishedWork, before, parent);
        break;
      }

    case _ReactWorkTags.HostComponent:
      {
        var _parent = parentFiber.stateNode;

        var _before = getHostSibling(finishedWork);

        insertOrAppendPlacementNode(finishedWork, _before, _parent);
        break;
      }
  }
}
/**
 * 遍历Fiber树并在每个Fiber上应用mutation副作用
 * @param {Fiber} finishedWork 已完成的工作单位，即Fiber节点
 * @param {Fiber} root Fiber树的根节点
 */


function commitMutationEffectsOnFiber(finishedWork, root) {
  var current = finishedWork.alternate;
  var flags = finishedWork.flags;

  switch (finishedWork.tag) {
    case _ReactWorkTags.FunctionComponent:
      {
        recursivelyTraverseMutationEffects(root, finishedWork);
        commitReconciliationEffects(finishedWork);

        if (flags & _ReactFiberFlags.Update) {
          commitHookEffectListUnmount(_ReactHookEffectTags.HasEffect | _ReactHookEffectTags.Layout, finishedWork);
        }

        break;
      }

    case _ReactWorkTags.HostRoot:
    case _ReactWorkTags.HostText:
      {
        recursivelyTraverseMutationEffects(root, finishedWork);
        commitReconciliationEffects(finishedWork);
        break;
      }

    case _ReactWorkTags.HostComponent:
      {
        recursivelyTraverseMutationEffects(root, finishedWork);
        commitReconciliationEffects(finishedWork);

        if (flags & _ReactFiberFlags.Update) {
          var instance = finishedWork.stateNode;

          if (instance !== null) {
            var newProps = finishedWork.memoizedProps;
            var oldProps = current !== null ? current.memoizedProps : newProps;
            var type = finishedWork.type;
            var updatePayload = finishedWork.updateQueue;
            finishedWork.updateQueue = null;

            if (updatePayload) {
              (0, _ReactDOMHostConfig.commitUpdate)(instance, updatePayload, type, oldProps, newProps, finishedWork);
            }
          }
        }

        break;
      }
  }
}

function commitPassiveUnmountEffects(finishedWork) {
  commitPassiveUnmountOnFiber(finishedWork);
}

function commitPassiveUnmountOnFiber(finishedWork) {
  var flags = finishedWork.flags;

  switch (finishedWork.tag) {
    case _ReactWorkTags.HostRoot:
      {
        recursivelyTraversePassiveUnmountEffects(finishedWork);
        break;
      }

    case _ReactWorkTags.FunctionComponent:
      {
        recursivelyTraversePassiveUnmountEffects(finishedWork);

        if (flags & _ReactFiberFlags.Passive) {
          commitHookPassiveUnmountEffects(finishedWork, _ReactHookEffectTags.HasEffect | _ReactHookEffectTags.Passive);
        }

        break;
      }
  }
}

function recursivelyTraversePassiveUnmountEffects(parentFiber) {
  if (parentFiber.subtreeFlags & _ReactFiberFlags.Passive) {
    var child = parentFiber.child;

    while (child !== null) {
      commitPassiveUnmountOnFiber(child);
      child = child.sibling;
    }
  }
}

function commitHookPassiveUnmountEffects(finishedWork, hookFlags) {
  commitHookEffectListUnmount(hookFlags, finishedWork);
}

function commitHookEffectListUnmount(flags, finishedWork) {
  var updateQueue = finishedWork.updateQueue;
  var lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;

  if (lastEffect !== null) {
    var firstEffect = lastEffect.next;
    var effect = firstEffect;

    do {
      if ((effect.tag & flags) === flags) {
        var destroy = effect.destroy;

        if (destroy !== undefined) {
          destroy();
        }
      }

      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
/**
 *
 * @param {*} root FiberRoot
 * @param {*} finishedWork RootFiber
 */


function commitPassiveMountEffects(root, finishedWork) {
  commitPassiveMountOnFiber(root, finishedWork);
}

function commitPassiveMountOnFiber(finishedRoot, finishedWork) {
  var flags = finishedWork.flags;

  switch (finishedWork.tag) {
    case _ReactWorkTags.HostRoot:
      {
        recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);
        break;
      }

    case _ReactWorkTags.FunctionComponent:
      {
        recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);

        if (flags & _ReactFiberFlags.Passive) {
          commitHookPassiveMountEffects(finishedWork, _ReactHookEffectTags.HasEffect | _ReactHookEffectTags.Passive);
        }

        break;
      }
  }
}

function recursivelyTraversePassiveMountEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & _ReactFiberFlags.Passive) {
    var child = parentFiber.child;

    while (child !== null) {
      commitPassiveMountOnFiber(root, child);
      child = child.sibling;
    }
  }
}

function commitHookPassiveMountEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork);
}

function commitHookEffectListMount(flags, finishedWork) {
  var updateQueue = finishedWork.updateQueue;
  var lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;

  if (lastEffect !== null) {
    var firstEffect = lastEffect.next;
    var effect = firstEffect;

    do {
      if ((effect.tag & flags) === flags) {
        var create = effect.create;
        effect.destroy = create();
      }

      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

function commitLayoutEffects(finishedWork, root) {
  var current = finishedWork.alternate;
  commitLayoutEffectOnFiber(root, current, finishedWork);
}

function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
  var flags = finishedWork.flags;

  switch (finishedWork.tag) {
    case _ReactWorkTags.HostRoot:
      {
        recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
        break;
      }

    case _ReactWorkTags.FunctionComponent:
      {
        recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);

        if (flags & _ReactFiberFlags.LayoutMask) {
          commitHookLayoutEffects(finishedWork, _ReactHookEffectTags.HasEffect | _ReactHookEffectTags.Layout);
        }

        break;
      }
  }
}

function commitHookLayoutEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork);
}

function recursivelyTraverseLayoutEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & _ReactFiberFlags.LayoutMask) {
    var child = parentFiber.child;

    while (child !== null) {
      var current = child.alternate;
      commitLayoutEffectOnFiber(root, current, child);
      child = child.sibling;
    }
  }
}