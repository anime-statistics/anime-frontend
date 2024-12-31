
import { Card } from 'react-bootstrap';
import styled from 'styled-components';

import { ItemDTO } from '../../DTOs/ItemDTO';


const ImageContainer = styled.div({
	aspectRatio : '1 / 1',
	overflow    : 'hidden',

	display    : 'flex',
	alignItems : 'center',
});

export function CatalogCard (item: ItemDTO)
{
	return (
		<Card className='mb-2'>
			<ImageContainer>
				<Card.Img title='poster' loading='lazy' src={ 'https://shikimori.one' + item.image.original } />
			</ImageContainer>

			<Card.Body>
				<Card.Title>{ item.russian }</Card.Title>
				<Card.Subtitle className='text-muted'>{ item.name }</Card.Subtitle>
			</Card.Body>
		</Card>
	);
}
