  "use client";
  import TextField from "~/components/ui/TextField";
  import TextArea from "~/components/ui/TextArea";
  import Button from "~/components/ui/Button";
  import Link from "next/link";
  import ImagePicker from "~/components/ui/ImagePicker";
  import {
    MdPhone,
    MdTitle,
    MdOutlinePriceChange,
  } from "react-icons/md";

  import { useFormState } from "react-dom";
  import { useEffect, useState } from "react";
  import { ActionState } from "~/types/Actions";


  export default function PublishForm({
    action,
    categories,
  }: {
    action: (state: ActionState, data: FormData) => Promise<typeof state>;
    categories: { id: string, name: string}[];
  }) {
    const [state, createFoodAction] = useFormState<ActionState, FormData>(
      action,
      {
        errors: {},
        success: false,
        id: null,
        slug: null,
      }
    );
    const [pending, setPending] = useState(false);
    const [formData, setFormData] = useState({
      category: "1", //Se establece el valor predeterminado para la categoria
    })

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormData({
        ...formData,
        category: e.target.value,
      });
    };
    return (
      <section className="p-4">
        <h1 className="text-xl mb-4">Publica tu nueva comida sana</h1>

        {state?.errors?.errorMessage ? (
          <h2 className="pt-1 flex items-center gap-1 text-red-700 dark:text-red-400">
            {state.errors.errorMessage}
          </h2>
        ) : null}
        <form
          method="POST"
          action={createFoodAction}
          onSubmit={(e) => {
            setPending(true);
          }}
          className=""
          aria-label="Publica tu nueva comida sana"
        >
          <TextField
            autoFocus
            required
            name="title"
            type="text"
            label="Titulo de la publicación:"
            icon={<MdTitle />}
            error={state?.errors?.title}
          />

          <TextField
            required
            name="price"
            type="number"
            label="Precio:"
            icon={<MdOutlinePriceChange />}
            error={state?.errors?.price}
          />

          {/* Campo de categoría */}
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Categoría:
          </label>
          <select
            id="category"
            name="category"
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>

          <ImagePicker
            name="image"
            label="Selecciona tu mejor imagen"
            className="mb-6"
            error={state.errors?.image}
            required
          ></ImagePicker>

          <TextField
            required
            name="phone"
            type="tel"
            label="Télefono"
            pattern={"^\\+?(\\d{1,3})?[0-9]{10}$"}
            placeholder="Ej: 278109216 o +522781092116"
            icon={<MdPhone />}
            error={state.errors?.phone}
          ></TextField>

          <TextArea
            name="content"
            required
            label="Descripción del producto:"
            rows={8}
            maxLength={250}
            error={state?.errors?.content as string}
          />
          <footer className="flex justify-center gap-5 mt-4">
            <Link href="/">
              <Button>Cancelar</Button>
            </Link>

            <Button
              type="submit"
              color="green"
              isLoading={pending && !state.success}
              disabled={pending && !state.success}
            >
              {pending && !state.success ? 'Publicando...' : 'Publicar'}
            </Button>
          </footer>
        </form>
        </section>
      );
    }