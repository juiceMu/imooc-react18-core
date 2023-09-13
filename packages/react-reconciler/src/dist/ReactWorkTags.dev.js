"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Layout = exports.HasEffect = exports.NoFlags = exports.HostText = exports.HostComponent = exports.HostRoot = exports.IndeterminateComponent = exports.ClassComponent = exports.FunctionComponent = void 0;
var FunctionComponent = 0; // 表示函数式组件，这是 React 中最基础的组件类型，通过函数返回 UI 结构

exports.FunctionComponent = FunctionComponent;
var ClassComponent = 1; // 表示类组件，这是 React 的另一种主要组件类型，通过 class 定义，可以使用生命周期方法等更复杂的特性

exports.ClassComponent = ClassComponent;
var IndeterminateComponent = 2; // 表示尚未确定类型的组件，在 React 渲染过程中，如果遇到了这种类型，会先尝试将其当做函数式组件处理

exports.IndeterminateComponent = IndeterminateComponent;
var HostRoot = 3; // 表示宿主环境的根节点，例如在浏览器环境中，这个就代表了整个 React App 的根节点

exports.HostRoot = HostRoot;
var HostComponent = 5; // 表示宿主环境的常规节点，例如在浏览器环境中，这就代表了一个普通的 DOM 元素，如 div、span 等

exports.HostComponent = HostComponent;
var HostText = 6; // 表示宿主环境的文本节点，例如在浏览器环境中，这就代表了一个文本节点

exports.HostText = HostText;
var NoFlags = 0;
exports.NoFlags = NoFlags;
var HasEffect = 1;
exports.HasEffect = HasEffect;
var Layout = 4;
exports.Layout = Layout;