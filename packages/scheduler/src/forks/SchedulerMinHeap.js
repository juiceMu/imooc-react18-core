/**
 * 将节点推入堆中
 * @param {Object[]} heap - 堆
 * @param {Object} node - 要推入的节点
 */
export function push(heap, node) {
  const index = heap.length;
  heap.push(node);
  siftUp(heap, node, index);
}

/**
 * 返回堆顶元素
 * @param {Object[]} heap - 堆
 * @returns {Object|null} 堆顶元素，如果堆为空，则返回 null
 */
export function peek(heap) {
  return heap.length === 0 ? null : heap[0];
}

/**
 * 从堆中弹出顶部元素
 * @param {Object[]} heap - 堆
 * @returns {Object|null} 堆顶元素，如果堆为空，则返回 null
 */
export function pop(heap) {
  if (heap.length === 0) {
    return null;
  }
  const first = heap[0];
  const last = heap.pop();
  if (last !== first) {
    heap[0] = last;
    siftDown(heap, last, 0);
  }
  return first;
}

/**
 * 将堆中的元素向上移动以维护堆的性质
 * @param {Object[]} heap - 堆
 * @param {Object} node - 要移动的节点
 * @param {number} i - 节点在堆中的索引
 */
function siftUp(heap, node, i) {
  let index = i;
  while (index > 0) {
    const parentIndex = (index - 1) >>> 1;
    const parent = heap[parentIndex];
    if (compare(parent, node) > 0) {
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      return;
    }
  }
}

/**
 * 将堆中的元素向下移动以维护堆的性质
 * @param {Object[]} heap - 堆
 * @param {Object} node - 要移动的节点
 * @param {number} i - 节点在堆中的索引
 */
function siftDown(heap, node, i) {
  let index = i;
  const length = heap.length;
  const halfLength = length >>> 1;
  while (index < halfLength) {
    const leftIndex = (index + 1) * 2 - 1;
    const left = heap[leftIndex];
    const rightIndex = leftIndex + 1;
    const right = heap[rightIndex];
    if (compare(left, node) < 0) {
      // 左子节点比node优先级高
      if (rightIndex < length && compare(right, left) < 0) {
        // 存在右子节点，且右子节点比左子节点优先级高
        // 将右子节点和node调换位置
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        //左子节点和node调换位置
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (rightIndex < length && compare(right, node) < 0) {
      // 存在右子节点，且右子节点比node优先级高
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      return;
    }
  }
}

/**
 * 比较两个节点
 * @param {Object} a - 第一个节点
 * @param {Object} b - 第二个节点
 * @returns {number} 比较结果，如果 a 小于 b，则返回小于 0 的数，如果 a 等于 b，则返回 0，如果 a 大于 b，则返回大于 0 的数
 * 数字越小，代表优先级越高，在二叉树位置越往上
 */
function compare(a, b) {
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}
