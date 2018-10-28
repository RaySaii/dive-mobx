import {action, autorun, observable, toJS, decorate, computed, runInAction} from 'mobx'
import {observer} from 'mobx-react'
import React from 'react'
import * as axios from 'axios'

class Store {
    _state = {}
}

decorate(Store, {
    _state: observable,
})
let _state = new Store()._state
let _id = 0

autorun(() => console.log(toJS(_state)))


export const Dive = ({
                         initialState = {}, lens, children, stateChange = () => {
    },
                     }) => {
    if (!children) {
        console.error('[dive] children is necessary in lens')
        return
    }
    let myId
    let update
    let myState
    if (typeof lens == 'object') {
        if (!lens.get) {
            console.error('[dive] get is necessary in lens')
            return
        }
        if (!lens.set) {
            console.error('[dive] set is necessary in lens')
            return
        }
        update = action((obj, init) => {
            const prevState = init ? {} : toJS(lens.get(_state))
            const newState = lens.set(_state, obj)
            Object.keys(newState).forEach(key => {
                if (_state[ key ] == undefined) {
                    _state[ key ] = newState[ key ]
                } else {
                    Object.keys(newState[ key ]).forEach(eleKey => {
                        _state[ key ][ eleKey ] = newState[ key ][ eleKey ]
                    })
                }
            })
            stateChange(lens.get(_state), prevState)
        })
        update(initialState, true)
        myState = lens.get(_state)
    } else {
        myId = typeof lens == 'string' ? lens : 'dive' + _id++
        const init = action(() => {
            Object.keys(initialState).forEach(key => {
                _state[ myId ] = _state[ myId ] || {}
                if (_state[ myId ][ key ] == undefined) {
                    _state[ myId ][ key ] = initialState[ key ]
                }
            })
        })
        init()
        update = action((obj, init) => {
            const prevState = init ? {} : toJS(_state[ myId ])
            _state[ myId ] = _state[ myId ] || {}
            _state[ myId ] = Object.assign(_state[ myId ], obj)
            stateChange(_state[ myId ], prevState)
        })
        update(initialState, true)
        myState = _state[ myId ]
    }
    const Proxy = observer(() => children(myState, update))
    return <Proxy/>
}

const httpFactory = (options) => {
    function promiseWithHandler(func) {
        let _globalDoneHandlers = this._doneHandlers
        let _globalErrorHandlers = this._errorHandlers

        class PromiseObservable {
            state = 'fresh'
            value = {}
            error = {}
            _switchMapCache
            _timer = null
            _mapToHandlers = []
            _mapResult = { value: this.value, state: this.state, error: this.error }
            _ownDoneHandlers = []
            _ownErrorHandlers = []


            checkStatus(response) {
                if (response.status >= 200 && response.status < 300) {
                    return response
                }

                const error = new Error(response.statusText)
                error.response = response
                throw error
            }

            _setFulfilled = res => {
                this.value = Object.assign(this.value, res)
                this.state = 'fulfilled'
                const handler = this._ownDoneHandlers.length != 0 ? this._ownDoneHandlers : _globalDoneHandlers
                handler.forEach(func => {
                    func(res)
                })
                this._mapToHandlers.forEach(func => {
                    func(this.value)
                })
            }
            _setRejected = err => {
                this.state = 'rejected'
                const handler = this._ownErrorHandlers.length != 0 ? this._ownErrorHandlers : _globalErrorHandlers
                handler.forEach(func => {
                    func(err)
                })
                this._mapToHandlers.forEach(func => {
                    func(this.value)
                })
            }
            reset = () => {
                this.state = 'fresh'
                Object.keys(this.value).forEach(key => {
                    delete this.value[ key ]
                })
                this._mapToHandlers.forEach(func => {
                    func(this.value)
                })
            }
            onError = (callback) => {
                this._ownErrorHandlers.push(callback)
            }
            done = (callback) => {
                this._ownDoneHandlers.push(callback)
            }
            setOptions = (options = {}) => {
                return this
            }
            mapTo = (callback) => {
                this._mapToHandlers.push(callback)
                return this._mapResult
            }
            send = (obj = {}, debounce = 0) => {
                this._switchMapCache = obj
                if (this._timer) {
                    clearTimeout(this._timer)
                    this._timer = null
                }
                this.reset()
                const fetch = () => {
                    runInAction(() => {
                        this.state = 'pending'
                    })
                    func(obj)
                        .then(this.checkStatus)
                        .then(res => {
                            // 这里先赋值,再改变状态
                            if (this._switchMapCache == obj) {
                                runInAction(() => this._setFulfilled(res))
                            }
                        })
                        .catch(err => {
                            if (this._switchMapCache == obj) {
                                runInAction(() => {
                                    this.error = err
                                    this._setRejected(err)
                                })
                            }
                        })
                }

                this._timer = setTimeout(fetch, debounce)

                return this
            }
            case = (obj) => {
                const ObservableComponent = observer(() => {
                    console.log('s', 'render')
                    if (this.state == 'rejected') {
                        return obj[ 'rejected' ] ? obj[ 'rejected' ](this.error) : null
                    } else {
                        return obj[ this.state ] ? obj[ this.state ](this.value) : null
                    }
                })
                return <ObservableComponent/>
            }
        }

        decorate(PromiseObservable, {
            state: observable,
            value: observable,
            error: observable,
            _mapResult: observable,
            _setFulfilled: action,
            _setRejected: action,
            reset: action,
            send: action,
        })

        return new PromiseObservable()
    }

    return ({
        get(url, options = {}) {
            return promiseWithHandler.call(this, (obj) => axios.get(url,
                { ...this.options, ...options, params: obj },
            ))
        },
        post(url, options = {}) {
            return promiseWithHandler.call(this, (obj) => axios.post(url, obj,
                { ...this.options, ...options },
            ))
        },
    })
}

export const HTTP = {
    options: {},
    _doneHandlers: [],
    _errorHandlers: [],
    with(options) {
        return httpFactory({ ...this.options, options })
    },
    ...httpFactory({}),
    setOptions(options) {
        this.options = options
    },
    onError(callback) {
        this._errorHandlers.push(callback)
    },
    done(callback) {
        this._doneHandlers.push(callback)
    },
}
