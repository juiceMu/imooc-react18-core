import { createRoot } from "react-dom/src/client/ReactDOMRoot";
let element = (
  <div>
    <h1>课程名称：手写React高质量源码迈向高阶开发</h1>
    <h2>讲师：杨艺韬</h2>
    <h3>
      电子书：
      <a style={{ color: "blue" }} href="https://www.yangyitao.com/react18">
        https://www.yangyitao.com/react18
      </a>
    </h3>
  </div>
  // <div>
  //   课程名称：手写React高质量源码迈向高阶开发
  //   {/* <div>讲师：杨艺韬</div>
  //   <div>
  //     电子书：
  //     <a style={{ color: "blue" }} href="https://www.yangyitao.com/react18">
  //       https://www.yangyitao.com/react18
  //     </a>
  //   </div> */}
  // </div>
);
const root = createRoot(document.getElementById("root"));

root.render(element);
