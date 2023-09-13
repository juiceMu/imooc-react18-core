"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.scheduleUpdateOnFiber = scheduleUpdateOnFiber;

var _scheduler = require("scheduler");

var _ReactFiber = require("./ReactFiber");

var _ReactFiberBeginWork = require("./ReactFiberBeginWork");

var _ReactFiberCompleteWork = require("./ReactFiberCompleteWork");

var _ReactFiberCommitWork = require("./ReactFiberCommitWork");

var _ReactFiberConcurrentUpdates = require("./ReactFiberConcurrentUpdates");

var _ReactFiberFlags = require("./ReactFiberFlags");

var workInProgress = null;
var rootDoesHavePassiveEffect = false;
var rootWithPendingPassiveEffects = null;
/**
 * 在Fiber上计划更新根节点
 * @param {*} root 根节点
 */

function scheduleUpdateOnFiber(root) {
  ensureRootIsScheduled(root);
}
/**
 * 确保根节点被调度执行
 * @param {*} root 根节点
 */


function ensureRootIsScheduled(root) {
  (0, _scheduler.scheduleCallback)(performConcurrentWorkOnRoot.bind(null, root));
}
/**
 * 执行根节点上的并发工作
 * @param {*} root 根节点
 */


function performConcurrentWorkOnRoot(root) {
  renderRootSync(root);
  var finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
}
/**
 * 提交根节点。
 * @param {*} root - 根节点。
 */


function commitRoot(root) {
  var finishedWork = root.finishedWork;

  if ((finishedWork.subtreeFlags & _ReactFiberFlags.Passive) !== _ReactFiberFlags.NoFlags || (finishedWork.flags & _ReactFiberFlags.Passive) !== _ReactFiberFlags.NoFlags) {
    if (!rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = true; // 会等commitRoot这个函数都执行完毕之后，才会执行NormalSchedulerPriority, flushPassiveEffect，而不是走到这时，立即执行

      (0, _scheduler.scheduleCallback)(flushPassiveEffect);
    }
  }

  var subtreeHasEffects = (finishedWork.subtreeFlags & _ReactFiberFlags.MutationMask) !== _ReactFiberFlags.NoFlags;
  var rootHasEffect = (finishedWork.flags & _ReactFiberFlags.MutationMask) !== _ReactFiberFlags.NoFlags;

  if (subtreeHasEffects || rootHasEffect) {
    (0, _ReactFiberCommitWork.commitMutationEffectsOnFiber)(finishedWork, root);
    (0, _ReactFiberCommitWork.commitLayoutEffects)(finishedWork, root);

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
 */


function prepareFreshStack(root) {
  workInProgress = (0, _ReactFiber.createWorkInProgress)(root.current, null);
  (0, _ReactFiberConcurrentUpdates.finishQueueingConcurrentUpdates)();
}
/**
 * 同步渲染根节点
 * @param {*} root 根节点
 */


function renderRootSync(root) {
  prepareFreshStack(root);
  workLoopSync();
}
/**
 * 同步工作循环
 */


function workLoopSync() {
  //div
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
/**
 * 执行一个工作单元
 * @param {*} unitOfWork 工作单元
 */


function performUnitOfWork(unitOfWork) {
  var current = unitOfWork.alternate;
  var next = (0, _ReactFiberBeginWork.beginWork)(current, unitOfWork);
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
  var completedWork = unitOfWork;

  do {
    var current = completedWork.alternate;
    var returnFiber = completedWork["return"];
    (0, _ReactFiberCompleteWork.completeWork)(current, completedWork);
    var siblingFiber = completedWork.sibling;

    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }

    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
}

function flushPassiveEffect() {
  if (rootWithPendingPassiveEffects !== null) {
    var root = rootWithPendingPassiveEffects;
    (0, _ReactFiberCommitWork.commitPassiveUnmountEffects)(root.current);
    (0, _ReactFiberCommitWork.commitPassiveMountEffects)(root, root.current);
  }
}