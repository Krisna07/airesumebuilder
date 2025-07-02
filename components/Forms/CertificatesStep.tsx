import React from "react";
import Input from "../Input";
import Button from "../Button";
import { Trash2 } from "lucide-react";
import { Certificates } from "@/types/types";


interface CertificatesStepProps {
  data: Certificates[];
  onChange: (data: Certificates[]) => void;
}

const CertificatesStep: React.FC<CertificatesStepProps> = ({
  data,
  onChange,
}) => {
  const addCertificate = () => {
    if (
      data.length > 0 &&
      (!data[0].title || !data[0].issued_by || !data[0].year)
    ) {
      return alert("Make sure to add details for the first certificate entry.");
    }
    onChange([
      ...data,
      {
        title: "",
        issued_by: "",
        year: "",
      },
    ]);
  };

  const removeCertificate = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateCertificate = (index: number, field: string, value: string) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  return (
    <>
      {data.map((certificate, index) => (
        <div key={index} className="w-full">
          <div className="flex items-center justify-between gap-4">
            <Input
              type="text"
              name="title"
              value={certificate.title}
              onChange={(e) =>
                updateCertificate(index, "title", e.target.value)
              }
              placeholder="Certificate Title"
            />
            <button
              type="button"
              onClick={() => removeCertificate(index)}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 size={20} />
            </button>
          </div>

          <Input
            type="text"
            name="issued_by"
            value={certificate.issued_by}
            onChange={(e) =>
              updateCertificate(index, "issued_by", e.target.value)
            }
            placeholder="Issued By"
          />
          <Input
            type="text"
            name="year"
            value={certificate.year}
            onChange={(e) => updateCertificate(index, "year", e.target.value)}
            placeholder="Year"
          />
        </div>
      ))}
      <Button
        variant={"secondary"}
        size={"small"}
        onClick={addCertificate}
        type="submit"
      >Add Certificates</Button>
    </>
  );
};

export default CertificatesStep;
