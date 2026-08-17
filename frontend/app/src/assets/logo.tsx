import { Component, type SVGProps } from 'react'

export interface LogoProps extends SVGProps<SVGSVGElement> {}

export default class Logo extends Component<LogoProps> {
    render() {
        const { className, ...props } = this.props
        return (
            <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" width="256" height="256" fill="none" className={className} {...props} >
                <path d="M 128 192 L 0 256 L 0 192 L 128 128 Z M 256 192 L 128 256 L 128 192 L 256 128 Z M 128 64 L 128 128 L 0 64 L 0 0 Z M 256 64 L 256 128 L 128 64 L 128 0 Z" />
            </svg>
        )
    }
}