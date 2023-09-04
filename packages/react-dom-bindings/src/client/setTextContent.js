/**
 * 设置节点的文本内容
 * @param {HTMLElement} node - 需要设置文本内容的DOM节点
 * @param {string} text - 需要设置的文本内容
 * setTextContent函数用于设置指定DOM节点的文本内容。
 */
export default function setTextContent(node, text) {
  node.textContent = text;
}
