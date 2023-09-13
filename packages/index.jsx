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

  console.log("number: ", number);
  return (
    <button
      onClick={() => {
        setAge(number + 1);
        setAge(number + 1);
      }}
    >
      {number}
    </button>
  );
}
const root = createRoot(document.getElementById("root"));
root.render(<MyFunctionComponent />);
