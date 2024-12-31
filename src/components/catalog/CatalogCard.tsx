
import { Card } from 'react-bootstrap';
import styled from 'styled-components';

import { ItemDTO } from '../../DTOs/ItemDTO';


const ImageContainer = styled.div({
	position : 'relative',

	aspectRatio : '1 / 1',
	overflow    : 'hidden',

	display    : 'flex',
	alignItems : 'center',
});

const ImageBackground = styled.img({
	position : 'absolute',
	left     : '50%',
	top      : 0,

	transform : 'translateX(-50%)',
	opacity   : '0.3',

	height : '100%',
	width  : 'auto',
});

export interface CatalogCardProps
{
	isActive : boolean;

	item : ItemDTO;
}

export function CatalogCard ({ isActive, item }: CatalogCardProps)
{
	return (
		<Card className={ 'mb-2 overflow-hidden' + (isActive && ' border-primary') }>
			<ImageContainer>
				<ImageBackground className='z-1' title='poster' loading='lazy' src={ 'https://shikimori.one' + item.image.original } />
				<Card.Img        className='z-2' title='poster' loading='lazy' src={ 'https://shikimori.one' + item.image.original } variant='top' />
			</ImageContainer>

			<Card.Body>
				<Card.Title>{ item.russian }</Card.Title>
				<Card.Subtitle className='text-muted'>{ item.name }</Card.Subtitle>
			</Card.Body>
		</Card>
	);
}
