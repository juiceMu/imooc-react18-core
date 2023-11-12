import {
  registerSimpleEvents,
  topLevelEventsToReactNames,
} from "../DOMEventProperties";
import { IS_CAPTURE_PHASE } from "../EventSystemFlags";
import { accumulateSinglePhaseListeners } from "../DOMPluginEventSystem";
import { SyntheticMouseEvent } from "../SyntheticEvent";

/**
 * 提取特定事件并将其加入调度队列
 * @param {Array} dispatchQueue 要处理的事件队列
 * @param {string} domEventName DOM 事件的名称，例如 'click'
 * @param {Object} targetInst 目标实例，接收事件的 React 组件
 * @param {Event} nativeEvent 原生的浏览器事件对象
 * @param {EventTarget} nativeEventTarget 原生的浏览器事件目标
 * @param {number} eventSystemFlags 事件系统标志，表示特定的事件状态
 * @param {Element} targetContainer 事件发生的 DOM 容器
 */
function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer
) {
  // 根据给定的DOM事件名，获取对应的React事件名
  const reactName = topLevelEventsToReactNames.get(domEventName);
  let SyntheticEventCtor;
  // 根据DOM事件名来确定要使用的合成事件构造函数
  switch (domEventName) {
    // 课程仅用点击事件做讲解
    case "click":
      // 对于 'click' 事件，使用 SyntheticMouseEvent
      SyntheticEventCtor = SyntheticMouseEvent;
      break;
    default:
      break;
  }
  // 通过与运算确定事件是否处于捕获阶段
  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  // 使用accumulateSinglePhaseListeners函数获取当前阶段的所有事件监听器
  const listeners = accumulateSinglePhaseListeners(
    targetInst,
    reactName,
    nativeEvent.type,
    isCapturePhase
  );
  // 如果存在至少一个监听器
  if (listeners.length > 0) {
    // 则创建一个新的合成事件
    const event = new SyntheticEventCtor(
      reactName,
      domEventName,
      null,
      nativeEvent,
      nativeEventTarget
    );
    // 并将其与相应的监听器一起加入调度队列
    // 不是直接使用原生事件，而是重新包装成一个新事件的原因：
    // 1.抹平不同浏览器中的差异
    // 2.提升性能
    dispatchQueue.push({
      event,
      listeners,
    });
  }
}

// 导出函数，重命名 registerSimpleEvents 为 registerEvents
export { registerSimpleEvents as registerEvents, extractEvents };
