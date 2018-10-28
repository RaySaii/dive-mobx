
import React from 'react'
import App from '../src/pages'
import renderer from 'react-test-renderer'
import {Dive} from '../src/dive'

test('text change when state change', () => {
    const component = renderer.create(
        <Dive
            initialState={{ a: { b: 3 } }}
            lens={'ok1'}
        >
            {
                (state, update) => {
                    return <div>
                        <div>{state.text}</div>
                        <button onClick={() => update({ a: { b: state.a.b + 1 } })}>+</button>
                    </div>
                }
            }
        </Dive>,
    )
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
})
