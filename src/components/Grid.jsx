import { Plane } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as t from "three/tsl";

export default function Grid({ gridSize = 20, lineWidth = 1, gridAlpha = 0.2, lineColor = "cyan", ...props }) {
  const materialRef = useRef();

  console.log(gridSize, lineWidth, gridAlpha, lineColor);

  useEffect(() => {
    if (!materialRef.current) return;

    // Thicken perimeter lines to account for them being at the edge
    // and effectively having half the thickness of other lines
    const edgeLineWidth = lineWidth * 2;

    // Create grid pattern
    const gridPattern = t.mod(t.mul(t.uv(), t.float(gridSize)), t.float(1.0));

    // Calculate distance to nearest grid line in x and y directions
    const distToXLine = t.min(gridPattern.x, t.sub(t.float(1.0), gridPattern.x));
    const distToYLine = t.min(gridPattern.y, t.sub(t.float(1.0), gridPattern.y));

    // Calculate derivatives for consistent line width at any angle
    const derivatives = t.fwidth(t.uv());
    const adjustedDerivX = t.mul(derivatives.x, t.float(gridSize));
    const adjustedDerivY = t.mul(derivatives.y, t.float(gridSize));

    // Detect edges (where UV is close to 0 or 1)
    const edgeX = t.or(t.lessThan(t.uv().x, derivatives.x), t.greaterThan(t.uv().x, t.sub(t.float(1.0), derivatives.x)));
    const edgeY = t.or(t.lessThan(t.uv().y, derivatives.y), t.greaterThan(t.uv().y, t.sub(t.float(1.0), derivatives.y)));

    // Choose line width based on whether we're at an edge
    const xWidth = t.select(edgeX, t.float(edgeLineWidth), t.float(lineWidth));
    const yWidth = t.select(edgeY, t.float(edgeLineWidth), t.float(lineWidth));

    // Create line masks with proper anti-aliasing based on screen-space derivatives
    // This ensures consistent visual width at any viewing angle
    const lineThresholdX = t.mul(xWidth, t.mul(adjustedDerivX, t.float(0.5)));
    const lineThresholdY = t.mul(yWidth, t.mul(adjustedDerivY, t.float(0.5)));

    // Use smoothstep for anti-aliased lines
    const gridX = t.smoothstep(t.float(0.0), lineThresholdX, distToXLine);
    const gridY = t.smoothstep(t.float(0.0), lineThresholdY, distToYLine);

    // Use min to show both X and Y lines
    const lineVisibility = t.sub(t.float(1.0), t.min(gridX, gridY));

    // Create final color with transparency
    // Multiply the grid's visibility by the overall alpha value
    const finalColor = t.vec4(
      t.color(lineColor),
      t.mul(lineVisibility, t.float(gridAlpha)) // Apply both grid pattern and global alpha
    );

    materialRef.current.colorNode = finalColor;
    materialRef.current.transparent = true;
    materialRef.current.needsUpdate = true;
  }, []);

  return (
    <Plane {...props}>
      <meshBasicNodeMaterial ref={materialRef} />
    </Plane>
  );
}
