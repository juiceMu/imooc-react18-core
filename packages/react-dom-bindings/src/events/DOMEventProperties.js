// 导入 EventRegistry 模块中的 registerTwoPhaseEvent 函数
import { registerTwoPhaseEvent } from "./EventRegistry";

import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  IdleEventPriority,
  getCurrentUpdatePriority,
} from "react-reconciler/src/ReactEventPriorities";
// 定义一个包含 'click' 的事件数组
const simpleEventPluginEvents = ["click"];

// 创建一个新的 Map 对象，用来存储顶层事件名到 React 事件名的映射
export const topLevelEventsToReactNames = new Map();

/**
 * 注册简单事件
 * @param {string} domEventName DOM事件名称
 * @param {string} reactName React事件名称
 */
function registerSimpleEvent(domEventName, reactName) {
  // 在Map对象中设置domEventName 和reactName的映射关系
  topLevelEventsToReactNames.set(domEventName, reactName);
  // 调用registerTwoPhaseEvent函数，注册为两阶段事件
  registerTwoPhaseEvent(reactName, [domEventName]);
}

/**
 * 注册简单事件数组中的所有事件
 */
export function registerSimpleEvents() {
  // 遍历 simpleEventPluginEvents 数组
  for (let i = 0; i < simpleEventPluginEvents.length; i++) {
    // 获取数组中的每个事件名
    const eventName = simpleEventPluginEvents[i];
    // 转换事件名为小写，得到domEventName
    const domEventName = eventName.toLowerCase();
    // 将事件名的首字母转换为大写，得到capitalizeEvent
    const capitalizeEvent = eventName[0].toUpperCase() + eventName.slice(1);
    // 调用registerSimpleEvent函数，注册该事件
    // 其中，reactName是'on'加上capitalizeEvent
    registerSimpleEvent(domEventName, `on${capitalizeEvent}`);
  }
}
export function getEventPriority(domEventName) {
  switch (domEventName) {
    case "click":
      return DiscreteEventPriority;
    case "drag":
      return ContinuousEventPriority;
    default:
      return DefaultEventPriority;
  }
}
