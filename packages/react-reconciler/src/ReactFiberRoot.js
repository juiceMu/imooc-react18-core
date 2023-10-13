import { createHostRootFiber } from "./ReactFiber";
import { NoLanes } from "./ReactFiberLane";
import { initialUpdateQueue } from "./ReactFiberClassUpdateQueue";

/**
 * FiberRoot：就是整个应用程序的根。就是根节点
 * RootFiber：整个Fiber树的根/起点
 * 区分二者的最重要的点就是注意单词的最后一个词。
 *   FiberRoot.current ---> RootFiber
 * RootFiber.stateNode ---> FiberRoot
 */

/**
 * Fiber根节点对象构造函数
 * @param {*} containerInfo 容器信息
 */
function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo; // 容器信息，如 div#root
  this.pendingLanes = NoLanes;
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
  // 根容器的current指向当前的根Fiber，也就是Fiber树
  root.current = uninitializedFiber;
  // 根Fiber的stateNode，即真实的DOM节点，指向FiberRootNode
  uninitializedFiber.stateNode = root;
  // 初始化根Fiber的更新队列
  initialUpdateQueue(uninitializedFiber);
  return root;
}
