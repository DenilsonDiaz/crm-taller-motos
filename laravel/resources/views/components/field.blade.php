@props([
    'name',
    'label',
    'type' => 'text',
    'value' => '',
    'required' => true,
])

<label class="form-label" for="{{ $name }}">{{ $label }}</label>

<input
    class="form-control {{ $errors->has($name) ? 'is-invalid' : '' }}"
    id="{{ $name }}"
    name="{{ $name }}"
    type="{{ $type }}"
    value="{{ $type === 'password' ? '' : old($name, $value) }}"
    @required($required)
    {{ $attributes }}
>

@error($name)
    <div class="field-error">{{ $message }}</div>
@enderror
