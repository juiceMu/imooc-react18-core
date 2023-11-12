import { push, peek, pop } from "./SchedulerMinHeap";
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
} from "./SchedulerPriorities";

const maxSigned31BitInt = 1073741823;
const IMMEDIATE_PRIORITY_TIMEOUT = -1;
const USER_BLOCKING_PRIORITY_TIMEOUT = 250;
const NORMAL_PRIORITY_TIMEOUT = 5000;
const LOW_PRIORITY_TIMEOUT = 10000;
const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

let scheduleHostCallback = null;
let taskIdCounter = 1; // 任务计数器
let taskQueue = []; // 任务最小堆数组
let currentTask = null;
let startTime = -1;
const frameInterval = 5; // 预期任务执行的间隔

const channel = new MessageChannel();
let port2 = channel.port2;
let port1 = channel.port1;
port1.onmessage = performWorkUntilDeadline;

/**
 * 获取当前时间
 * @returns {number} 当前时间，以毫秒为单位
 */
function getCurrentTime() {
  return performance.now();
}

/**
 * 调度回调函数
 * @param {ImmediatePriority | UserBlockingPriority | NormalPriority | LowPriority | IdlePriority} priorityLevel - 优先级
 * @param {Function} callback - 要执行的回调函数
 * @returns {Object} 新创建的任务对象
 */
export function scheduleCallback(priorityLevel, callback) {
  const currentTime = getCurrentTime();
  const startTime = currentTime;
  let timeout; // 超时时间
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT;
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT;
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }
  // 到期时间
  const expirationTime = startTime + timeout;
  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime, // 超时时间
    sortIndex: expirationTime,
  };
  push(taskQueue, newTask);
  requestHostCallback(workLoop);
  return newTask;
}

/**
 * 判断是否应该交还控制权给主机
 * @returns {boolean} 如果应该交还控制权给主机，则返回 true；否则返回 false
 */
function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    return false;
  }
  return true;
}

/**
 * 工作循环，执行任务队列中的任务
 * @param {number} startTime - 工作循环的开始时间
 * @returns {boolean} 如果还有未完成的任务，返回 true；否则返回 false
 */
function workLoop(startTime) {
  let currentTime = startTime;
  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break;
    }
    const callback = currentTask.callback;
    if (typeof callback === "function") {
      currentTask.callback = null;
      // 判断任务是否已经超时
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      // 后续继续执行的任务
      const continueationCallback = callback(didUserCallbackTimeout);
      if (typeof continueationCallback === "function") {
        // 将后续继续执行的任务重新存储
        currentTask.callback = continueationCallback;
        return true;
      }
      if (currentTask === peek(taskQueue)) {
        // 说明任务已经执行完毕，将任务从任务堆中去除
        pop(taskQueue);
      }
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
  if (currentTask !== null) {
    return true;
  }
  return false;
}

/**
 * 请求主机回调
 * @param {Function} workLoop - 工作循环函数
 */
function requestHostCallback(workLoop) {
  scheduleHostCallback = workLoop;
  schedulePerformWorkUntilDeadline();
}

/**
 * 安排执行工作直到截止时间
 */
function schedulePerformWorkUntilDeadline() {
  port2.postMessage(null);
}

/**
 * 执行工作直到截止时间
 */
function performWorkUntilDeadline() {
  if (scheduleHostCallback) {
    startTime = getCurrentTime();
    let hasMoreWork = true;
    try {
      hasMoreWork = scheduleHostCallback(startTime);
    } finally {
      if (hasMoreWork) {
        schedulePerformWorkUntilDeadline();
      } else {
        scheduleHostCallback = null;
      }
    }
  }
}

export {
  scheduleCallback as unstable_scheduleCallback,
  shouldYieldToHost as unstable_shouldYield,
  ImmediatePriority as unstable_ImmediatePriority,
  UserBlockingPriority as unstable_UserBlockingPriority,
  NormalPriority as unstable_NormalPriority,
  LowPriority as unstable_LowPriority,
  IdlePriority as unstable_IdlePriority,
};
