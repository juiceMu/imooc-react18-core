import {
  HostComponent,
  HostRoot,
  IndeterminateComponent,
  HostText,
} from "./ReactWorkTags";
import { NoFlags } from "./ReactFiberFlags";
import { NoLanes } from "./ReactFiberLane";

/**
 * 构造函数，用于创建一个新的Fiber节点
 * @param {*} tag fiber的类型，如函数组件、类组件、原生组件、根元素等
 * @param {*} pendingProps 新属性，等待处理或者说生效的属性
 * @param {*} key 唯一标识
 */
export function FiberNode(tag, pendingProps, key) {
  this.tag = tag; //代表fiber节点的类型
  this.key = key;
  this.type = null; //代表fiber节点对应虚拟DOM的类型
  this.stateNode = null; //对于类组件，这是组件实例。对于原生 DOM 元素，这是实际的 DOM 节点。
  this.return = null; //指向父 Fiber 节点的指针
  this.child = null; //指向第一个子 Fiber 节点的指针。
  this.sibling = null; //指向兄弟 Fiber 节点的指针。
  this.pendingProps = pendingProps; // 等待生效的props
  this.memoizedProps = null; //已经生效的props
  this.memoizedState = null; //已经生效的state
  this.updateQueue = null; //等待更新的队列
  this.flags = NoFlags; //描述 Fiber 节点需要执行的副作用类型（如插入、更新或删除）。
  this.subtreeFlags = NoFlags;
  this.alternate = null; //指向当前 Fiber 节点的替代 Fiber 节点，这是双缓存技术的关键部分。
  this.index = 0; // 在同级节点中的序号
  this.lanes = NoLanes;
}

/**
 * 用于创建新的Fiber节点
 * @param {number} tag Fiber的类型
 * @param {*} pendingProps 新属性
 * @param {*} key 唯一标识
 * @returns {FiberNode} 新的Fiber节点
 */
export function createFiber(tag, pendingProps, key) {
  return new FiberNode(tag, pendingProps, key);
}

/**
 * 创建新的HostRoot类型的Fiber节点
 * @returns {FiberNode} 新的HostRoot类型的Fiber节点
 */
export function createHostRootFiber() {
  return createFiber(HostRoot, null, null);
}

/**
 * 基于旧的Fiber节点和新的属性创建一个新的Fiber节点
 * @param {FiberNode} current 旧的Fiber节点
 * @param {*} pendingProps 新的属性
 * @returns {FiberNode} 新的Fiber节点
 */
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
  }
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  return workInProgress;
}

/**
 * 从虚拟DOM创建新的Fiber节点
 * @param {*} element 虚拟DOM元素
 * @returns {FiberNode} 新的Fiber节点
 */
export function createFiberFromElement(element) {
  const { type, key, props: pendingProps } = element;
  return createFiberFromTypeAndProps(type, key, pendingProps);
}

/**
 * 从类型和属性创建新的Fiber节点
 * @param {*} type Fiber节点的类型
 * @param {*} key 唯一标识
 * @param {*} pendingProps 新的属性
 * @returns {FiberNode} 新的Fiber节点
 */
function createFiberFromTypeAndProps(type, key, pendingProps) {
  let tag = IndeterminateComponent;
  if (typeof type === "string") {
    tag = HostComponent;
  }
  const fiber = createFiber(tag, pendingProps, key);
  fiber.type = type;
  return fiber;
}

/**
 * 创建一个新的文本类型的Fiber节点
 * @param {*} content 文本内容
 * @returns {FiberNode} 新的文本类型的Fiber节点
 */
export function createFiberFromText(content) {
  return createFiber(HostText, content, null);
}
