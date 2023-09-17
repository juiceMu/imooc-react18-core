import { HostRoot } from "./ReactWorkTags";

// 并发队列数组
const concurrentQueues = [];
// 并发队列索引
let concurrentQueuesIndex = 0;

/**
 * 从源Fiber向上遍历树，找到根节点
 * @param {Fiber} sourceFiber 源Fiber
 * @returns {Node|null} 如果找到根节点(FiberRoot)，则返回根节点，否则返回null
 */
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber;
  let parent = sourceFiber.return;
  while (parent !== null) {
    node = parent;
    parent = parent.return;
  }
  // 持续向上遍历树，直到找到根节点
  if (node.tag === HostRoot) {
    // 证明node为RootFiber，RootFiber.stateNode指向的是FiberRoot
    // 所以返回FiberRoot
    return node.stateNode;
  }
  return null;
}
/**
 * 将钩子更新加入并发队列
 * @param {Object} fiber - fiber对象
 * @param {Object} queue - 更新队列
 * @param {Object} update - 更新对象
 * @param {number} lane - 车道信息
 * @returns {Object|null} 更新的fiber的根，如果不存在则返回null
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
  enqueueUpdate(fiber, queue, update, lane);
  return getRootForUpdatedFiber(fiber);
}

/**
 * 将更新加入并发队列
 * @param {Object} fiber fiber对象
 * @param {Object} queue 更新队列
 * @param {Object} update 更新对象
 * @param {number} lane - 车道信息
 */
function enqueueUpdate(fiber, queue, update, lane) {
  concurrentQueues[concurrentQueuesIndex++] = fiber;
  concurrentQueues[concurrentQueuesIndex++] = queue;
  concurrentQueues[concurrentQueuesIndex++] = update;
  // concurrentQueues[concurrentQueuesIndex++] = lane;
}

/**
 * 完成并发更新的排队
 */
export function finishQueueingConcurrentUpdates() {
  const endIndex = concurrentQueuesIndex;
  concurrentQueuesIndex = 0;
  let i = 0;
  while (i < endIndex) {
    const fiber = concurrentQueues[i++];
    const queue = concurrentQueues[i++];
    const update = concurrentQueues[i++];
    if (queue !== null && update !== null) {
      const pending = queue.pending;
      if (pending === null) {
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }
      queue.pending = update;
    }
  }
}

/**
 * 获取更新的fiber的根节点
 * @private
 * @param {Object} sourceFiber - 源fiber节点
 * @returns {Object|null} fiber的根节点，如果不存在则返回null
 */
function getRootForUpdatedFiber(sourceFiber) {
  let node = sourceFiber;
  let parent = node.return;
  while (parent !== null) {
    node = parent;
    parent = node.return;
  }
  return node.tag === HostRoot ? node.stateNode : null;
}
