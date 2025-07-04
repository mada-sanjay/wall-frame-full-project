import React from "react";

const ShapeSelector = ({ currentShape, onChange }) => (
  <div className="form-group">
    <label>Choose Shape for New Images:</label>
    <select value={currentShape} onChange={onChange}>
      <option value="square">Square</option>
      <option value="rectangle">Rectangle</option>
      <option value="circle">Circle</option>
      <option value="diamond">Diamond</option>
    </select>
  </div>
);

export default ShapeSelector; 