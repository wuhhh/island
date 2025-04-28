export default function mergeRefs(refs) {
  return value => {
    refs.forEach(ref => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref && typeof ref === "object") {
        ref.current = value;
      }
    });
  };
}
