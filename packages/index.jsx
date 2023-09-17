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
  const [number, setAge] = React.useState(0);
  const [number1, setAge1] = React.useState(0);

  console.log("number: ", number);
  console.log("number1: ", number1);
  React.useEffect(() => {
    console.log("create");
    return () => {
      console.log("destroy");
    };
  }, [number]);

  return (
    <div>
      <button
        onClick={() => {
          setAge(number + 1);
        }}
      >
        {number}
      </button>
      <button
        onClick={() => {
          setAge1(number1 + 1);
        }}
      >
        {number1}
      </button>
    </div>
  );
}
const root = createRoot(document.getElementById("root"));
root.render(<MyFunctionComponent />);
