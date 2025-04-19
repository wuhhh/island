import React from "react";
import Kbd from "./Kbd";

const KeyBindingItem = ({ keyCombination, action }) => {
  return (
    <li className='flex items-center space-x-2'>
      <span className='flex-shrink-0'>
        {keyCombination.map((key, index) => (
          <React.Fragment key={index}>
            <Kbd>{key}</Kbd>
            {index < keyCombination.length - 1 && " + "}
          </React.Fragment>
        ))}
      </span>
      <span>{action}</span>
    </li>
  );
};

export default KeyBindingItem;
