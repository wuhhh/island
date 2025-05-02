import React from "react";

import Kbd from "./Kbd";

const KeyBindingItem = ({ keyCombination = null, action, tag = "li", separator = " ", flip }) => {
  return React.createElement(
    tag,
    { className: "flex items-center gap-x-2" + (flip ? " flex-row-reverse" : "") },
    <span className='contents'>
      {keyCombination && (
        <span className='flex-shrink-0'>
          {keyCombination.map((key, index) => (
            <React.Fragment key={index}>
              <Kbd>{key}</Kbd>
              {index < keyCombination.length - 1 && separator}
            </React.Fragment>
          ))}
        </span>
      )}
    </span>,
    <span>{action}</span>
  );
};

export default KeyBindingItem;
