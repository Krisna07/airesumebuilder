import React from "react";
import Button from "../Button";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface FormNavigatorProps {
  handleSubmit: () => void;
}

const FormNavigator: React.FC<FormNavigatorProps> = ({ handleSubmit }) => {
  return (
    <div className="w-full flex items-center justify-between pt-2">
      <Button
        type="submit"
        size={"small"}
        variant="secondary"
        fullWidth={false}
      >
        <FaChevronLeft /> Back
      </Button>
      <Button
        type="submit"
        size={"small"}
        variant="primary"
        onClick={handleSubmit}
        fullWidth={false}
      >
        Next <FaChevronRight />
      </Button>
    </div>
  );
};

export default FormNavigator;
