'use strict';
class vue_like_create {
    constructor() {
        this.data = {};
        this.methods = {};
        this.els = [];
        this.subRender = null;
        this.output = {};
        this.query = {
            re: new RegExp(/{{\s([^\{\}]+)\s}}/)
        };
    }

    createApp(content) {
        this.data = content.data;
        this.methods = content.methods;

        // 更改方法的this
        for (let i in this.methods) {
            this.methods[i].bind(this);
        }

        // 绑定数据代理
        const that = this;
        this.data = new Proxy(this.data, {
            get: function (target, propKey, receiver) {
                return Reflect.get(target, propKey, receiver);
            },
            set: function (target, propKey, value, receiver) {
                // console.log(arguments);
                if (target[propKey] == value) {
                    return true;
                }
                if (Reflect.set(target, propKey, value, receiver)) {
                    that.render();
                    return true;
                }
                return false;
            }
        })

        // 绑定渲染函数
        if (content.render) {
            this.subRender = content.render.bind(this);
        }

        return this;
    }

    // 绑定加载对象
    mount(el) {
        if (el[0] == '#') {
            // id对象绑定
            this.els.push(document.getElementById(el.substr(1)));
        } else if (el[0] == '.') {
            // 类对象绑定
            let resoult = document.getElementsByClassName(el.substr(1));
            this.els.push(...resoult);
        }
        // 立即渲染一次
        this.render();
        return this;
    }

    // 输出渲染函数
    render() {
        for (let i of this.els) {
            // 创建渲染对象
            while (i.firstChild) {
                i.removeChild(i.firstChild);
            }
            this.output = this.subRender();
            // console.log(this.output.innerText);
            i.appendChild(this.output);
        }
    }
};

class vue_like {
    createApp(content) {
        return new vue_like_create().createApp(content);
    }

    // 渲染函数
    h(tag, props, children) {
        return function () {
            // console.log(par_methods, children, tag);
            var elem = document.createElement(tag);
            // console.log(this, children, arguments);
            for (let i in props) {
                if (this && this.methods) {
                    if (i == 'onclick') {
                        elem[i] = this.methods[props[i]].bind(this.data);
                    } else {
                        elem[i] = props[i];
                    }
                }
            }
            switch (typeof children) {
                case 'string':
                    elem.innerText = children;
                    let query_res = this.query.re.exec(elem.innerText);
                    // console.log(query_res);
                    if (query_res) {
                        for (let i of query_res) {
                            // console.log(i, this.data, this.data[i]);
                            while (this.data[i] != undefined && (elem.innerText.indexOf("{{ " + i + " }}") != -1)) {
                                elem.innerText = elem.innerText.replace("{{ " + i + " }}", this.data[i]);
                            }
                        }
                    }
                    break;
                case 'function':
                    var child = children.call(this);
                    elem.appendChild(child);
                    break;
                case 'object':
                    if (Array.isArray(children)) {
                        for (let i of children) {
                            i.bind(this);
                            // console.log(i);
                            elem.appendChild(i.call(this))
                        }
                    }
                    break;
                default:
                    elem.innerText = (typeof children);
                    break;
            }
            return elem;
        }
    }
}

export default new vue_like();