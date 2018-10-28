import React, {Component} from 'react'
import './App.css'
import {Dive, HTTP} from './dive'
import {toJS} from 'mobx'

HTTP.onError(err => console.log('global', err))
HTTP.done(res => {
    if (!res.data.success) {
        alert(res.data.msg)
    }
})
const fetchHit = HTTP.get('http://10.100.12.25:9999/manis/company/hit')

const App = () => {
    return (
        <Dive
            initialState={{
                a: { b: 2 },
                address: '',
                data: fetchHit.mapTo(response => response),
            }}
            lens={'ok'}
            stateChange={(state, prevState) => {
                if (state.address !== prevState.address) {
                    fetchHit.reset()
                    if (state.address.length > 1) {
                        fetchHit.send({ keyword: state.address }, 500)
                    }
                }
            }}>
            {
                (state, update) => {
                    console.log('a',toJS(state))
                    return <div>
                        {state.a.b}
                        <button onClick={() => update({ a: { b: state.a.b + 1 } })}>+</button>
                        <input value={state.address} onChange={e => update({ address: e.target.value })}/>
                        <button onClick={() => update({ address: '杭州' })}>set</button>
                        {state.a.b > 4 && <Test/>}
                        <Test ok={2}/>
                    </div>
                }
            }
        </Dive>
    )
}

const Test = ({ ok = 1 }) => (
    <Dive initialState={{ a: ok }}
          // lens={{ get: state => state.ok, set: (state, ownState) => state }}
    >
        {
            (state, update) => {
                console.log('test',state)
                return (
                    <div>
                        <h4>{state.a}</h4>
                        {
                            fetchHit.case({
                                pending: () => <div>Loading</div>,
                                fulfilled: (value) => <div>
                                    {value.data.data ? value.data.data.map(name => <div key={name}>{name}</div>) :
                                        <div>nothing</div>}
                                </div>,
                                rejected: err => <div>
                                    {err.message}
                                </div>,
                            })
                        }
                    </div>
                )
            }
        }
    </Dive>
)
export default App
