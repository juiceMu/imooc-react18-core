import { createRoot } from "react-dom/src/client/ReactDOMRoot";
let element = (
  <h1>
    {/* <h1>h1文本</h1>
    <h2>
      <span>h2-1文本</span>
      <li></li>
    </h2>
    <h3>
      h3-1文本
      <a style={{ color: "blue" }} href="https://www.yangyitao.com/react18">
        h3-2-1文本
      </a>
      h3-3文本
    </h3> */}

    <h2>
      <h3 text="h3-1文本"></h3>
      <h3 text="h3-2文本"></h3>
      <h3>
        <span text="h3-3-1文本"></span>
        <span text="h3-3-2文本"></span>
      </h3>
    </h2>
    <h2 text="h2-2文本"></h2>
  </h1>
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
