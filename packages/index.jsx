import { createRoot } from "react-dom/src/client/ReactDOMRoot";
import * as React from "react";

function getAge(state, action) {
  switch (action.type) {
    case "add":
      return state + action.value;
    default:
      return state;
  }
}
function MyFunctionComponent() {
  // const [number, setAge] = React.useState(0);
  // const [number1, setAge1] = React.useState(0);

  // console.log("number: ", number);
  // console.log("number1: ", number1);
  // React.useEffect(() => {
  //   console.log("create");
  //   return () => {
  //     console.log("destroy");
  //   };
  // }, [number]);

  return (
    <div>
      <h1>这里是标题</h1>
      <h2>文字文字</h2>
    </div>
  );
}
const root = createRoot(document.getElementById("root"));
root.render(<MyFunctionComponent />);
