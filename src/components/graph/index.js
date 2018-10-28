import {Dive} from '../../dive'
import React from 'react'

const Graph = ({}) => (
    <Dive>
        <div className={styles.container}>
            {(showButton && network) &&
            <Control network={network[level]}
                     level={level}
                     container={styles.container}
                     pop={pop}
                     force={force}
                     sources={sources}/>}
            {showDetail && <Detail pop={pop} meta={data} force={force} sources={sources}/>}
            {
                data && (
                    <>
                        <Graph graph={graph['level1']}
                               getNetwork={getNetwork('level1')}
                               stabilizationIterationsDone={sources.react.handler('done')}
                               {...commonProps}
                               style={{ ...commonProps.style, zIndex: level == 'level1' ? 1 : 0 }}/>
                        {flag && <Graph graph={graph['level2']}
                                        getNetwork={getNetwork('level2')}
                                        stabilizationIterationsDone={sources.react.handler('done')}
                                        {...commonProps}
                                        style={{ ...commonProps.style, zIndex: level == 'level2' ? 1 : 0 }}/>}
                    </>
                )
            }
        </div>
    </Dive>
)

export default Graph
