/**
 * @license
 * Copyright 2016 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as _ from 'lodash';
import * as React from 'react';
import { div } from 'react-dom-factories'
import { EnabledResizeOptions, MosaicDirection } from './types';

const RESIZE_THROTTLE_MS = 1000 / 30; // 30 fps

export interface SplitProps extends EnabledResizeOptions {
    direction: MosaicDirection;
    splitPercentage: number;
    onChange?: (percentOfParent: number) => void;
    onRelease?: (percentOfParent: number) => void;
}

class SplitClass extends React.PureComponent<SplitProps> {
    private rootElement: HTMLElement | null;

    static defaultProps = {
        onChange: () => void 0,
        onRelease: () => void 0,
        minimumPaneSizePercentage: 20,
    };

    render() {
        return div({
            className: 'mosaic-split',
            ref: (el) => this.rootElement = el,
            onMouseDown: this.onMouseDown,
            style: this.computeStyle(),
        }, div({ className: 'mosaic-split-line' }));
    }

    componentWillUnmount() {
        document.removeEventListener('mousemove', this.onMouseMove, true);
        document.removeEventListener('mouseup', this.onMouseUp, true);
    }

    private computeStyle() {
        const positionStyle = this.props.direction === 'column' ? 'top' : 'left';
        return {
            [positionStyle]: `${this.props.splitPercentage}%`,
        };
    }

    private onMouseDown = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        document.addEventListener('mousemove', this.onMouseMove, true);
        document.addEventListener('mouseup', this.onMouseUp, true);
    };

    private onMouseUp = (event: MouseEvent) => {
        document.removeEventListener('mousemove', this.onMouseMove, true);
        document.removeEventListener('mouseup', this.onMouseUp, true);

        const percentage = this.calculatePercentOfParent(event);
        if (percentage !== this.props.splitPercentage) {
            this.props.onRelease!(percentage);
        }
    };

    private onMouseMove = _.throttle((event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const percentage = this.calculatePercentOfParent(event);
        if (percentage !== this.props.splitPercentage) {
            this.props.onChange!(percentage);
        }
    }, RESIZE_THROTTLE_MS);

    private calculatePercentOfParent(event: MouseEvent): number {
        const { minimumPaneSizePercentage } = this.props;
        const parentBBox = this.rootElement!.parentElement!.getBoundingClientRect();

        let percentage: number;
        if (this.props.direction === 'column') {
            percentage = (event.clientY - parentBBox.top) / parentBBox.height * 100.0;
        } else {
            percentage = (event.clientX - parentBBox.left) / parentBBox.width * 100.0;
        }

        return _.clamp(percentage, minimumPaneSizePercentage!, 100 - minimumPaneSizePercentage!);
    }
}

export const Split = React.createFactory(SplitClass as React.ComponentClass<SplitProps>);
