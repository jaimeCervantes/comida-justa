import { useState } from "react";

export default function CategorySelect({
  categories,
}:{
   categories: {id: string, name: string}[];
}) {
  const [category, setCategory] = useState("");
  return (
    <select
      id="category"
      name="category"
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      required
      className="mt-1 mb-10 block pt-4 pb-4 pl-3 pr-10 w-full border-black focus:border-pw-green focus:outline focus:outline-pw-green px-2 py-1 dark:text-white bg-pw-gray"
    >
      <option value="">Selecciona una categoría</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
