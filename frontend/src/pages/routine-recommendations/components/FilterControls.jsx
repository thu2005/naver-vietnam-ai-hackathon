import React from "react";
import Select from "../../../components/ui/Select";

const FilterControls = ({
  routineType,
  setRoutineType,
  priceRange,
  setPriceRange,
}) => {
  const routineOptions = [
    {
      value: "minimal",
      label: "Quy trình tối giản (3-5 bước)",
      description: "Phù hợp cho người bận rộn",
    },
    {
      value: "comprehensive",
      label: "Quy trình toàn diện (7-10 bước)",
      description: "Chăm sóc da chuyên sâu",
    },
  ];

  const priceOptions = [
    {
      value: "low",
      label: "Tiết kiệm (100.000 - 500.000 VNĐ)",
      description: "Sản phẩm phù hợp túi tiền",
    },
    {
      value: "medium",
      label: "Trung bình (500.000 - 1.500.000 VNĐ)",
      description: "Chất lượng tốt, giá hợp lý",
    },
    {
      value: "high",
      label: "Cao cấp (1.500.000+ VNĐ)",
      description: "Sản phẩm premium, hiệu quả cao",
    },
  ];

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <Select
            label="Loại quy trình chăm sóc"
            description="Chọn mức độ phức tạp phù hợp với lối sống của bạn"
            options={routineOptions}
            value={routineType}
            onChange={setRoutineType}
            placeholder="Chọn loại quy trình..."
            className="w-full"
          />
        </div>

        <div className="flex-1">
          <Select
            label="Khoảng giá mong muốn"
            description="Lựa chọn ngân sách phù hợp cho quy trình của bạn"
            options={priceOptions}
            value={priceRange}
            onChange={setPriceRange}
            placeholder="Chọn khoảng giá..."
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
