// 引入hasOwnProperty函数和REACT_ELEMENT_TYPE常量
import hasOwnProperty from "shared/hasOwnProperty";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";

// 定义一些在React元素中保留的属性
const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};

// 检查config对象中是否有ref属性
function hasValidRef(config) {
  return config.ref !== undefined;
}
// 检查config对象中是否有key属性
function hasValidKey(config) {
  return config.key !== undefined;
}

// 创建一个React元素（虚拟DOM）
function ReactElement(type, key, ref, props) {
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
  };
}

/**
 * 因为jsx会被转译工具（一般是babel）转化为React.createElement这样的函数调用，而我们实现了这个函数，
 把jsx转化为虚拟dom对象也可以抽象为两步，第一步将jsx转化为函数调用，第二步，将相关参数传给这个函数并返回虚拟dom值。
 只不过第一步是babel完成的，第二步是react内部实现的。所以我们要在react源码中实现这个能返回虚拟dom的函数。
 */
// 创建一个React元素的函数，处理key和ref属性，并将其他属性添加到props对象中
export function jsxDEV(type, config, maybeKey) {
  let propName;
  const props = {};
  let key = null;
  let ref = null;

  // 如果maybeKey参数存在，将其赋值给key
  if (typeof maybeKey !== "undefined") {
    key = maybeKey;
  }

  if (hasValidKey(config)) {
    key = "" + config.key;
  }

  // 如果config对象中有ref属性，将其赋值给ref
  if (hasValidRef(config)) {
    ref = config.ref;
  }

  // 遍历config对象，将非保留属性添加到props对象中
  for (propName in config) {
    if (
      hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName];
    }
  }

  // 返回一个新的React元素
  return ReactElement(type, key, ref, props);
}
