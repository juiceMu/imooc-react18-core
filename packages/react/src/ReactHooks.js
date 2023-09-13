import ReactCurrentDispatcher from "./ReactCurrentDispatcher";

/**
 * 返回当前的React Dispatcher
 * @returns {object} 当前的React Dispatcher
 */
function resolveDispatcher() {
  return ReactCurrentDispatcher.current;
}

/**
 * 使用指定的reducer函数和初始参数调用当前的dispatcher的useReducer方法
 * @param {Function} reducer - 一个接收两个参数并返回新的state的函数，第一个参数为当前state，第二个参数为派发的action
 * @param {*} initialArg - 作为reducer函数的初始参数，返回的新的state
 * @return {Array} - 包含最新state和dispatch函数的数组
 */
export function useReducer(reducer, initialArg) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg);
}

export function useState(reducer, initialArg) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(reducer, initialArg);
}

export function useEffect(create) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create);
}

export function useLayoutEffect(create, deps) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useLayoutEffect(create, deps);
}
