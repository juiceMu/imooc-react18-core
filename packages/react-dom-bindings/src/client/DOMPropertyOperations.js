/**
 * 设置节点的属性
 * @param {HTMLElement} node 目标节点
 * @param {string} name 属性名
 * @param {*} value 属性值
 */
export function setValueForProperty(node, name, value) {
  if (value === null) {
    // 如果传入的属性值为null，则会移除节点的对应属性
    node.removeAttribute(name);
  } else {
    // 将属性值设置到节点的对应属性上
    node.setAttribute(name, value);
  }
}
