import { createHostRootFiber } from "./ReactFiber";
import { initialUpdateQueue } from "./ReactFiberClassUpdateQueue";

/**
 * Fiber根节点对象构造函数
 * @param {*} containerInfo 容器信息
 */
function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo; // 容器信息，如 div#root
}

/**
 * 创建Fiber根节点
 * @param {*} containerInfo 容器信息
 * @returns {FiberRootNode} 创建的Fiber根节点
 */
export function createFiberRoot(containerInfo) {
  const root = new FiberRootNode(containerInfo);
  // 创建未初始化的根 Fiber
  const uninitializedFiber = createHostRootFiber();
  // 根容器的current指向当前的根Fiber
  root.current = uninitializedFiber;
  // 根Fiber的stateNode，即真实的DOM节点，指向FiberRootNode
  uninitializedFiber.stateNode = root;
  // 初始化根Fiber的更新队列
  initialUpdateQueue(uninitializedFiber);
  return root;
}
