const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = "__reactFiber$" + randomKey;
const internalPropsKey = "__reactProps$" + randomKey;

/**
 * 在dom元素上存储对应的fiber节点
 * @param {*} hostInst fiber节点
 * @param {*} node DOM元素
 */
export function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst;
}

/**
 * 在DOM元素上存储该DOM元素上的所有属性
 * @param {*} node DOM元素
 * @param {*} props DOM元素上的所有属性
 */
export function updateFiberProps(node, props) {
  node[internalPropsKey] = props;
}

/**
 * 通过dom元素获取对应的fiber节点
 * @param {HTMLElement} targetNode DOM元素
 * @returns {Fiber} Fiber节点
 */
export function getClosestInstanceFromNode(targetNode) {
  const targetInst = targetNode[internalInstanceKey];
  return targetInst;
}

export function getFiberCurrentPropsFromNode(node) {
  return node[internalPropsKey] || null;
}
