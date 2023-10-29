/* Drag Solo -

Two components exist for dragging, the _host_ and the draggables.

1. initate a new DragSolo()
2. Enable dragging on your items.


dragHost = new DragSolo()
dragHost.enable('.box')
dragHost.enable('h1')

*/
class Draggable {
    tracking = false
    constructor(node, host) {
        this.node = node;
        this.host = host;
        this.onChangeHooks = []
        this.space = {
            clientY: 0
            , clientX: 0
            , offsetX: 0
            , offsetY: 0
        }
    }

    static enable(selector) {
        let nodes = document.querySelectorAll(selector)
        for(let node of nodes) {
            if(node.dataset.draggable == undefined)  {
                this.add(node)
            }
        }
    }

    static add(node) {
        node.dataset.draggable = 'draggable'
        node.dataset.draggableId = Math.random().toString(32).slice(2, 6)

        this.host.nodes[node.dataset.draggableId] = new Draggable(node)
    }

    get position(){
        if(this.tracking){
            return new Position(this.space.clientX, this.space.clientY)
        }

        return this.getLivePosition()
    }

    setPosition(pos) {
        this.setNodeXY(pos.x, pos.y)
    }

    onChange(func) {
        this.onChangeHooks.push(func)
    }

    getLivePosition(){
        let rect = this.node.getBoundingClientRect()

        return (function(v){ let {x,y} = v; return {x,y} })(rect)
    }

    mousedownEvent(e, node) {
        // copy the node position into this position when moved.
        if(this.node == node) {
            this.tracking = true
            console.log('mousedown', this.id())
            this.host.tracking.add(this)
            this.node.dataset.dragging = 'dragging'
            Object.assign(this.space, {
                offsetY: e.offsetY
                , offsetX: e.offsetX
            })
        } else {
            console.log('Will not mousedownEvent', node, this.node)
        }
    }

    mousemoveEvent(e) {
        if(this.tracking) {
            Object.assign(this.space, {
                    clientY: e.clientY
                    , clientX: e.clientX
                })
            this.presentSpaceXY()
            // console.log('move', this.clientX, this.clientY)
        }
    }

    id() {
        return this.node.dataset.draggableId
    }

    mouseupEvent(event) {
        let node = event.target
        if(this.tracking) {
            // console.log('mouseup', this.id(), 'onto', node)
            console.log('mouseup', this.node, this.space.clientX, this.space.clientY)
            this.node.dataset.dragging = ''
            // this.presentSpaceXY()
            this.tracking = false
            this.host.tracking.delete(this)
        }
    }

    presentSpaceXY() {
        let x = this.space.clientX - this.space.offsetX
        let y = this.space.clientY - this.space.offsetY
        this.setNodeXY(x, y)

        for(let cf of this.onChangeHooks) {
            cf({x,y})
        }
    }

    setNodeXY(x,y) {
        // this.position.x = x
        // this.position.y = y
        this.node.style.top = `${y}px`
        this.node.style.left = `${x}px`
    }
}


class DragSolo {

    constructor(parent=document) {
        this.parent = parent
        this.nodes = {}
        this.tracking = new Set
        this.mouseTrack = false
        this.listening = false
    }

    enable(selector) {
        let nodes = [selector]
        let r = []
        if(typeof(selector) == 'string') {
            nodes = document.querySelectorAll(selector)
        }

        for(let node of nodes) {
            if(node.dataset.draggable == undefined)  {
                let d = this.add(node)
                r.push(d)
            }
        }

        if(this.listening != true) {
            this.listen()
        }
        return r
    }

    add(node) {
        node.dataset.draggable = 'draggable'
        node.dataset.draggableId = Math.random().toString(32).slice(2, 10)
        return this.nodes[node.dataset.draggableId] = new Draggable(node, this)
    }

    listen(hostTarget=undefined) {
        let host = this;
        hostTarget = hostTarget || this.parent
        let body = document.body

        let mousedown = function(event){
            let node = event.target
            host.mouseTrack = true
            // console.log('mouseDown', node)
            let dn = host.nodes[node.dataset.draggableId]
            if(dn != undefined) {
                // console.log('Drag', dn)
                dn.mousedownEvent(event, node)
                body.dataset.draghost='mousedown'
            }

            // console.log(event.target, event.currentTarget)
        }

        let mousemove = function(event){
            // console.log('mousemove')
            if(host.mouseTrack == false){
                return
            }

            let node = event.target
            // let dn = host.nodes[node]
            // console.log(host.tracking.size)
            let isTracking = false
            for(let dn of host.tracking) {
                dn.mousemoveEvent(event)
                isTracking = true
                // console.log(event.target, event.currentTarget)
            }

            if (isTracking){
                body.dataset.draghost='mousemove'
            }
        }


        let mouseup = function(event){
            host.mouseTrack = false
            let node = event.target
            // console.log('mouseUp', node)

            let isTracking = false
            for(let dn of host.tracking) {
                isTracking = true
                dn.mouseupEvent(event)
                // console.log(event.target, event.currentTarget)
            }
            if (isTracking){
                body.dataset.draghost='mouseup'
            }
        }


        hostTarget.addEventListener('click', function(event){
            let node = event.target
            // console.log('click', node)
        })

        hostTarget.addEventListener('mousemove', mousemove)
        hostTarget.addEventListener('mouseup', mouseup)
        hostTarget.addEventListener('mousedown', mousedown)

        this.listening = true
    }
}


document.addEventListener("DOMContentLoaded", (event) => {
    let selectors = []
    let nodes = document.querySelectorAll('script[dragsolo-selector]')
    for(let node of nodes) {
        // let node = nodes[i]
        if(node) {
            let selector = node.getAttribute('dragsolo-selector')
            selectors.push(selector)
        }
    }
    if(selectors.length > 0) {
        let dh = window.dragHost = new DragSolo()
        for(let s of selectors) {
            dh.enable(s)
        }
    }
});