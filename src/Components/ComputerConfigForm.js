import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Define the validation schema
const schema = yup.object().shape({
  baseModel: yup.string().required('Base model is required'),
  components: yup.array().of(
    yup.object().shape({
      type: yup.string().required('Component type is required'),
      name: yup.string().required('Component name is required'),
      price: yup.number().positive('Price must be positive').required('Price is required'),
      capacity: yup.string().test('capacity-required', 'Capacity is required for RAM and Storage', function(value) {
        const { type } = this.parent;
        return !['ram', 'storage'].includes(type) || value;
      }),
      storageType: yup.string().test('storageType-required', 'Storage type is required for Storage components', function(value) {
        const { type } = this.parent;
        return type !== 'storage' || value;
      }),
    })
  ).min(1, 'At least one component is required'),
  totalPrice: yup.number().min(1, 'Total price must be greater than 0').required('Total price is required'),
});

const ComputerConfigForm = React.memo(() => {
  const { control, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm({
    defaultValues: {
      baseModel: '',
      components: [],
      totalPrice: 0,
    },
    resolver: yupResolver(schema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'components',
  });

  const [submittedData, setSubmittedData] = useState(null);

  useEffect(() => {
    const subscription = watch((value) => {
      const total = value.components.reduce((sum, component) => sum + (parseFloat(component.price) || 0), 0);
      if (total !== getValues('totalPrice')) {
        setValue('totalPrice', total);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue, getValues]);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name && name.startsWith('components') && name.endsWith('type')) {
        const index = name.split('.')[1];
        if (value.components[index].type === 'ram') {
          setValue(`components.${index}.capacity`, '');
        } else if (value.components[index].type === 'storage') {
          setValue(`components.${index}.capacity`, '');
          setValue(`components.${index}.storageType`, '');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const onSubmit = (data) => {
    console.log('Form data:', data); 
    setSubmittedData(data); 
  };

  const handleAppend = useCallback(() => {
    append({ type: '', name: '', price: 0 });
  }, [append]);

  const handleRemove = useCallback((index) => {
    remove(index);
  }, [remove]);

  const totalComponents = useMemo(() => fields.length, [fields]);

  const handleSave = () => {
    if (submittedData) {
     
      localStorage.setItem('computerConfig', JSON.stringify(submittedData));
      console.log('Submitted Data:', submittedData);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <h2>Base Model</h2>
          <Controller
            name="baseModel"
            control={control}
            render={({ field }) => (
              <input {...field} placeholder="Base Model" />
            )}
          />
          {errors.baseModel && <p>{errors.baseModel.message}</p>}
        </div>

        <div>
          <h2>Components</h2>
          {fields.map((field, index) => (
            <div key={field.id}>
              <Controller
                name={`components.${index}.type`}
                control={control}
                render={({ field }) => (
                  <select {...field}>
                    <option value="">Select Component Type</option>
                    <option value="cpu">CPU</option>
                    <option value="gpu">GPU</option>
                    <option value="ram">RAM</option>
                    <option value="storage">Storage</option>
                  </select>
                )}
              />
              {errors.components?.[index]?.type && <p>{errors.components[index].type.message}</p>}

              <Controller
                name={`components.${index}.name`}
                control={control}
                render={({ field }) => (
                  <input {...field} placeholder="Component Name" />
                )}
              />
              {errors.components?.[index]?.name && <p>{errors.components[index].name.message}</p>}

              <Controller
                name={`components.${index}.price`}
                control={control}
                render={({ field }) => (
                  <input {...field} type="number" placeholder="Price" />
                )}
              />
              {errors.components?.[index]?.price && <p>{errors.components[index].price.message}</p>}

              {watch(`components.${index}.type`) === 'ram' && (
                <Controller
                  name={`components.${index}.capacity`}
                  control={control}
                  render={({ field }) => (
                    <input {...field} placeholder="RAM Capacity (GB)" />
                  )}
                />
              )}
              {watch(`components.${index}.type`) === 'storage' && (
                <>
                  <Controller
                    name={`components.${index}.capacity`}
                    control={control}
                    render={({ field }) => (
                      <input {...field} placeholder="Storage Capacity (GB)" />
                    )}
                  />
                  {errors.components?.[index]?.capacity && <p>{errors.components[index].capacity.message}</p>}
                  <Controller
                    name={`components.${index}.storageType`}
                    control={control}
                    render={({ field }) => (
                      <select {...field}>
                        <option value="">Select Storage Type</option>
                        <option value="ssd">SSD</option>
                        <option value="hdd">HDD</option>
                      </select>
                    )}
                  />
                  {errors.components?.[index]?.storageType && <p>{errors.components[index].storageType.message}</p>}
                </>
              )}

              <button type="button" onClick={() => handleRemove(index)}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={handleAppend}>Add Component</button>
        </div>
        <div>
          <h3>Total Components: {totalComponents}</h3>
          <h3>Total Price: ${watch('totalPrice')}</h3>
        </div>
        <button type="submit">Submit Form</button>
      </form>

      {submittedData && (
        <div>
          <h3>Submitted Data</h3>
          <p><strong>Base Model:</strong> {submittedData.baseModel}</p>
          <h4>Components:</h4>
          <ul>
            {submittedData.components.map((component, index) => (
              <li key={index}>
                <p><strong>Type:</strong> {component.type}</p>
                <p><strong>Name:</strong> {component.name}</p>
                <p><strong>Price:</strong> ${component.price}</p>
                {component.type === 'ram' && <p><strong>Capacity:</strong> {component.capacity} GB</p>}
                {component.type === 'storage' && (
                  <>
                    <p><strong>Capacity:</strong> {component.capacity} GB</p>
                    <p><strong>Storage Type:</strong> {component.storageType}</p>
                  </>
                )}
              </li>
            ))}
          </ul>
          <p><strong>Total Price:</strong> ${submittedData.totalPrice}</p>
        </div>
      )}
      <button onClick={handleSave}>Save</button>
    </>
  );
});

export default ComputerConfigForm;
