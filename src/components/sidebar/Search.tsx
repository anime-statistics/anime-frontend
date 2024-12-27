
import { FloatingLabel, Form, InputGroup } from 'react-bootstrap';


export function Search ()
{
	return (
		<InputGroup>
			<Form.Select title='Тип работы'>
				<option>Аниме</option>
				<option>Манга</option>
			</Form.Select>

			<FloatingLabel label='Найти по названию'>
				<Form.Control placeholder='Пять невест' />
			</FloatingLabel>
		</InputGroup>
	);
}
