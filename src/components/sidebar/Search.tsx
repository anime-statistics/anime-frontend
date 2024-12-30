
import { FloatingLabel, Form, InputGroup } from 'react-bootstrap';


export interface SearchProps
{
	setType : React.Dispatch<React.SetStateAction<string>>;
	type    : string;

	setSearch : React.Dispatch<React.SetStateAction<string>>;
	search    : string;
}

export function Search ({ setType, type, setSearch, search }: SearchProps)
{
	return (
		<InputGroup>
			<Form.Select
				title = 'Тип работы'

				onChange = { ev => setType(ev.target.value) }
				value    = { type }
			>
				<option>Аниме</option>
				<option>Манга</option>
			</Form.Select>

			<FloatingLabel label='Найти по названию'>
				<Form.Control
					placeholder = 'Пять невест'

					onChange = { ev => setSearch(ev.target.value) }
					value    = { search }
				/>
			</FloatingLabel>
		</InputGroup>
	);
}
