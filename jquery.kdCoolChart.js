;(function(window, $, undefined){
    'use strict';
    uniqueIDs.coolChart = 0;
    /**
    ** Data type
    ** Includes: boolean, number, string, function, array, date, regexp, object, error
    **/
    var checkData = {
        dataType: function(obj){
            var type = 'undefined';
            switch(Object.prototype.toString.apply(obj)){
                case '[object Boolean]': type = 'boolean'; break;
                case '[object Number]': type = 'number'; break;
                case '[object String]': type = 'string'; break;
                case '[object Function]': type = 'function'; break;
                case '[object Array]': type = 'array'; break;
                case '[object Date]': type = 'date'; break;
                case '[object RegExp]': type = 'regexp'; break;
                case '[object Object]': type = 'object'; break;
                case '[object Error]': type = 'error'; break;
                default: 'undefined'; break;
            }
            return type;
        },
        isFunction: function(obj){
            return this.dataType(obj) === 'function';
        },
        isObject: function(obj){
            return this.dataType(obj) === 'object';
        }
    };

    var svgPathMethods = {
        /*point: function(x, y, path){
            if(path === undefined) path = '';
            path += (path === '' ? 'M' : ' L') + x + ',' + y;
            return path;
        },*/
        point: function(x, y, path, x1, y1){
            if(path === undefined) path = '';

            if(path === ''){
                path += 'M';
            }else{
                if(x1 !== undefined){
                    path += ' Q';
                    path += x1 + ',' + y1 + ' ';
                }else{
                    path += ' L';
                }
            }
            path += x + ',' + y;

            return path;
        },
        points: function(points, path){
            if(path === undefined) path = '';
            for(var i = 0; i < points.length; i++){
                path = this.point(points[i][0], points[i][1], path);
            }
            return path;
        },
        pathLength: function(path){

            return Snap.path.getTotalLength(path).toNumberic(2);
        },
        degreeToPoint: function(o, r, degree){
            var radian, x, y;

            radian = Math.PI * (degree - 270 + 180) / 180;
            x = (o[0] + r * Math.cos(radian)).toNumberic(2);
            y = (o[1] + r * Math.sin(radian)).toNumberic(2);

            return [x, y];
        },
        arcToPath: function(o, r, degreeStart, degreeEnd){
            var pointStart, pointEnd, isLargeArc;

            pointStart = this.degreeToPoint(o, r, degreeStart);
            pointEnd = this.degreeToPoint(o, r, degreeEnd);
            isLargeArc = (degreeEnd - degreeStart) > 180 ? 1 : 0;

            return "M" + pointStart[0] + "," + pointStart[1] + " A" + r + "," + r + " 0 " + isLargeArc + ",1 " + pointEnd[0] + "," + pointEnd[1];
        }
    };

    var Chart = Class({
        init: function(element, options){
            this.element = $(element);

            if(this._setOptions(options) === false){
                console.log('Warning: Please set this.options.datas!');
                return false;
            }

            this.uniqueID = uniqueIDs.coolChart++;
            this.prefixed = 'coolChart' + this.options.type.replace('-', '').toCapitalize() + this.uniqueID;
            this.eventNamespace = '.' + this.prefixed;
            if(this.element[0].id === ''){
                this.element[0].id = this.prefixed;
                this.idIsGenerated = true;
            }
        },
        update: function(){},
        destroy: function(){
            if(this.idISGenrated){
                this.element[0].id = '';
                this.element.removeAttr('id');
            }
            this.element.removeData('kdCoolChart');
        }
    });

    var PieChart = Class(Chart, {
        init: function($super, element, options){
            if($super(element, options) === false) return false;

            this._getSVGSize();

            this.snap = Snap(this.element[0]).attr({
                width: this.svgSize,
                height: this.svgSize
            });

            if(this.options.links.items !== false){
                this.items = $(this.options.links.items);
            }

            this._drawArcs();

            this.options.callbacks.init.apply(this, arguments);

            this.showArcs();

            this._triggerFunction();
        },
        _setOptions: function($super, options){
            this.options = $.extend(true, {
                size: 200,
                drawDuration: 2000,
                drawEasing: mina.bounce,
                strokeWidth: 20, // for full-pie and half-pie
                strokeWidthHover: 30, // for full-pie and half-pie
                gapBetweenArcs: 1, // for full-pie and half-pie
                startDegree: function(){
                    return this.type === 'half-pie' ? -130 : 0;
                }, // for full-pie and half-pie
                scopeDegree: function(){
                    return this.type === 'half-pie' ? 260 : 360;
                }, // for full-pie and half-pie
                callbacks: {
                    init: function(){},
                    destroy: function(){},
                    beforeShowArc: function(index, arc, data){
                        return true;
                    },
                    afterShowArc: function(index, arc, data){},
                    beforeShowArcs: function(){
                        return true;
                    },
                    afterShowArcs: function(){},
                    beforeHideArc: function(index, arc, data){
                        return true;
                    },
                    afterHideArc: function(index, arc, data){},
                    beforeHideArcs: function(){
                        return true;
                    },
                    afterHideArcs: function(){},
                    beforeUpdate: function(){
                        return true;
                    },
                    afterUpdate: function(){},
                    beforeMouseover: function(index, arc, data){},
                    afterMouseover: function(index, arc, data){},
                    beforeMouseout: function(index, arc, data){},
                    afterMouseout: function(index, arc, data){}
                },
            }, options);
            
            if(this.options.datas === undefined || this.options.datas.length === 0){
                return false;
            }
            
            for(var i = 0; i < this.options.datas.length; i++){
                if(checkData.isFunction(this.options.datas[i].value)){
                    this.options.datas[i].value = this.options.datas[i].value.apply(this.options, arguments);
                }
            }

            if(checkData.isFunction(this.options.size)){
                this.options.size = this.options.size.apply(this.options, arguments);
            }
            if(checkData.isFunction(this.options.strokeWidth)){
                this.options.strokeWidth = this.options.strokeWidth.apply(this.options, arguments);
            }
            if(checkData.isFunction(this.options.strokeWidthHover)){
                this.options.strokeWidthHover = this.options.strokeWidthHover.apply(this.options, arguments);
            }
            if(checkData.isFunction(this.options.startDegree)){
                this.options.startDegree = this.options.startDegree.apply(this.options, arguments);
            }
            if(checkData.isFunction(this.options.scopeDegree)){
                this.options.scopeDegree = this.options.scopeDegree.apply(this.options, arguments);
            }
        },
        _getSVGSize: function(){
            
            var strokeGap;
            
            strokeGap = this.options.strokeWidthHover - this.options.strokeWidth;

            this.svgSize = (this.options.size + strokeGap * 2).toNumberic();
        },
        _getCenterPoint: function(){
            var x, y;

            x = (this.svgSize / 2).toNumberic(2);
            y = x;

            return [x, y];
        },
        _getRadius: function(){
            var radius, radiusHover, strokeGap;
            
            strokeGap = this.options.strokeWidthHover - this.options.strokeWidth;
            radius = (this.options.size / 2 - this.options.strokeWidth / 2).toNumberic(2);
            radiusHover = (radius + strokeGap / 2).toNumberic(2);
            
            return {
                normal: radius,
                hover: radiusHover
            };
        },
        _generateArcPathByIndex: function(index){
            var data,
                degrees,
                radius = this._getRadius(),
                centerPoint = this._getCenterPoint();

            degrees = this._getArcDegreesByIndex(index);

            return {
                normal: (degrees[0] === degrees[1] ? '' : svgPathMethods.arcToPath(centerPoint, radius.normal, degrees[0], degrees[1])),
                hover: (degrees[0] === degrees[1] ? '' : svgPathMethods.arcToPath(centerPoint, radius.hover, degrees[0], degrees[1]))
            };
        },
        _getArcDegreesByIndex: function(index){
            var i, previousDegree = this.options.startDegree, degree = 0;

            for(i = 0; i < index; i++){
                previousDegree += this.options.datas[i].value * this.options.scopeDegree;
            }
            degree = this.options.datas[index].value * this.options.scopeDegree + previousDegree;

            previousDegree = previousDegree.toNumberic(2);
            degree = degree.toNumberic(2);

            if(previousDegree === degree){
                previousDegree -= this.options.gapBetweenArcs;
                degree = previousDegree;
            }else{
                previousDegree += this.options.gapBetweenArcs;
                degree -= this.options.gapBetweenArcs;
            }

            return [previousDegree, degree];
        },
        _drawArc: function(index, callback){
            var shadow = this.snap.paper.filter(Snap.filter.shadow(0, 2, 5, '#CAD5EB')),
                path,
                arcPaths = [],
                pathLength = 0;

            arcPaths = this._generateArcPathByIndex(index);
            
            if(this.arcs[index] !== undefined){
                path = this.arcs[index].attr({
                    d: arcPaths.normal
                });
            }else{
                path = this.snap.path(arcPaths.normal).attr({
                    class: 'cool-chart-arc cool-chart-arc-' + index,
                    fill: 'none',
                    strokeWidth: this.options.strokeWidth,
                    filter: shadow
                }).data('index', index);
            }
            path.attr({
                stroke: this.options.datas[index].color
            });

            this.arcs[index] = path;

            pathLength = svgPathMethods.pathLength(path);

            this.arcs[index].attr({
                strokeDashoffset: pathLength,
                strokeDasharray: pathLength
            });

            if(callback !== undefined){
                callback.apply(this, [index, this.arcs[index]], this.options.datas[index]);
            }
            return this.arcs[index];
        },
        _drawArcs: function(){
            var g = this.snap.paper.g().attr({class: 'cool-chart-arc-group'}),
                path, i;

            this.arcs = [];

            for(i = 0; i < this.options.datas.length; i++){
                path = this._drawArc(i);
                g.add(path);
            }
        },
        _triggerFunction: function(){
            var self = this, i,
                arc, arcPath, index;

            for(i = 0; i < this.arcs.length; i++){
                this.arcs[i]
                    .unmouseover()
                    .mouseover(function(){
                        if(self.isDrawing) return false;

                        arc = this;
                        index = this.data('index');
                        arcPath = self._generateArcPathByIndex(index);

                        if(self.options.callbacks.beforeMouseover.apply(self, [index, arc, self.options.datas[index]])){
                            return false;
                        }

                        if(self.items !== undefined){
                            self.items.eq(index).addClass('hover');
                        }

                        this.addClass('hover').animate({
                            d: arcPath.hover,
                            strokeWidth: self.options.strokeWidthHover
                        }, 300, mina.bounce, function(){
                            self.options.callbacks.afterMouseover.apply(self, [index, arc, self.options.datas[index]]);
                        });
                    })
                    .unmouseout()
                    .mouseout(function(){
                        if(self.isDrawing) return false;
                        
                        arc = this;
                        index = this.data('index');
                        arcPath = self._generateArcPathByIndex(index);

                        if(self.options.callbacks.beforeMouseout.apply(self, [index, arc, self.options.datas[index]])){
                            return false;
                        }

                        if(self.items !== undefined){
                            self.items.eq(index).removeClass('hover');
                        }

                        this.removeClass('hover').animate({
                            d: arcPath.normal,
                            strokeWidth: self.options.strokeWidth
                        }, 300, mina.bounce, function(){
                            self.options.callbacks.afterMouseout.apply(self, [index, arc, self.options.datas[index]]);
                        });
                    });
            }
            if(this.items !== undefined){
                this.items
                    .off('mouseover' + self.eventNamespace)
                    .on('mouseover' + self.eventNamespace, function(){
                        if(self.isDrawing) return false;
                        
                        index = $(this).data(self.options.dataIndexName);
                        $(self.arcs[index]).trigger('mouseover');
                    })
                    .off('mouseout' + self.eventNamespace)
                    .on('mouseout' + self.eventNamespace, function(){
                        if(self.isDrawing) return false;
                        
                        index = $(this).data(self.options.dataIndexName);
                        $(self.arcs[index]).trigger('mouseout');
                    });
            }
        },

        showArc: function(index, callback){
            var self = this,
                duration = this.options.datas[index].value * this.options.drawDuration,
                arc = this.arcs[index];

            this.isDrawing = true;

            if(this.options.callbacks.beforeShowArc.apply(this, [index, arc, this.options.datas[index]]) === false){
                return false;
            }

            if(this.items !== undefined){
                this.items.eq(index).find(self.options.links.mark).css({
                    'background-color': 'transparent'
                });
            }
            
            arc.animate({
                strokeDashoffset: 0
            }, duration, this.options.drawEasing, function(){
                self.isDrawing = false;

                this.attr({
                    strokeDasharray: 0
                });

                if(self.items !== undefined){
                    self.items.eq(index).find(self.options.links.mark).css({
                        'background-color': self.options.datas[index].color
                    });
                }

                self.options.callbacks.afterShowArc.apply(self, [index, arc, self.options.datas[index]]);
                
                if(checkData.isFunction(callback)){
                    callback.apply(self, [index, arc, self.options.datas[index]]);
                }
            });
        },
        showArcs: function(index, callback){
            if(index === undefined){
                if(this.options.callbacks.beforeShowArcs.apply(this, arguments) === false) return false;
                index = 0;
            }
            if(index === this.options.datas.length){
                this.options.callbacks.afterShowArcs.apply(this, arguments);

                if(checkData.isFunction(callback)){
                    callback.apply(this, arguments);
                }
                return false;
            }

            var self = this;

            this.showArc(index, function(){
                self.showArcs(index + 1, callback);
            });
        },
        hideArc: function(index, callback){
            var self = this,
                pathLength = this._getPathLength(this.arcs[index]),
                arc = this.arcs[index];

            if(this.options.callbacks.beforeHideArc.apply(this, [index, arc, this.options.datas[index]]) === false){
                return false;
            }

            arc.animate({
                strokeDashoffset: pathLength,
                strokeDasharray: pathLength
            }, 1, mina.linear, function(){
                self.options.callbacks.afterHideArc.apply(self, [index, arc, self.options.datas[index]]);
                
                if(checkData.isFunction(callback)){
                    callback.apply(self, [index, arc]);
                }
            });
        },
        hideArcs: function(index, callback){
            if(index === undefined){
                if(this.options.callbacks.beforeHideArcs.apply(this, arguments) === false) return false;
                index = 0;
            }
            if(index === this.options.datas.length){
                this.options.callbacks.afterHideArcs.apply(this, arguments);
                
                if(checkData.isFunction(callback)){
                    callback.apply(this, arguments);
                }
                return false;
            }

            var self = this;

            this.hideArc(index, function(){
                self.hideArcs(index + 1, callback);
            });
        },
        update: function(datas, callback){
            var self = this;

            if(this.options.callbacks.beforeUpdate(this, arguments) === false) return false;

            this.options.datas = datas;

            this.element.find('.cool-chart-arc-group').remove();

            this._drawArcs();

            this._triggerFunction();

            this.showArcs(undefined, function(){
                self.options.callbacks.afterUpdate(self, arguments);
                
                if(checkData.isFunction(callback)){
                    callback.apply(self, arguments);
                }
            });
        },
        destroy: function($super){
            $super();

            this.options.callbacks.destroy.apply(this, arguments);
        }
    });

    var LineChart = Class(Chart, {
        init: function($super, element, options){
            if($super(element, options) === false) return false;

            this.snap = Snap(this.element[0]).attr({
                width: this.options.size.width,
                height: this.options.size.height
            });

            if(this.options.links.items !== false){
                this.items = $(this.options.links.items);
            }

            if(this.options.links.popup !== false){
                this.popup = $(this.options.links.popup);
                if(this.options.links.popupItems !== false){
                    this.popupItems = this.popup.find(this.options.links.popupItems);
                }
            }

            this.svgCanvasSize = {
                width: this.options.size.width - this.options.padding.left - this.options.padding.right,
                height: this.options.size.height - this.options.padding.top - this.options.padding.bottom
            };
            this.gridSize = {
                horizontal: (this.svgCanvasSize.width / (this.options.horizontalAllLabels.length - 1)).toNumberic(2),
                vertical: (this.svgCanvasSize.height / (this.options.verticalValueMax / this.options.verticalValueUnit)).toNumberic(2)
            };

            this._setMarksColor();

            this._setDataLinesPoints();

            this._drawLabels();

            this._drawGrid();

            this.svgDataLines = [];
            this._drawDataLines();

            this._drawAxisAndCrossPoints();

            this.options.callbacks.init.apply(this, arguments);

            this.showDataLines();

            this._triggerFunction();
        },
        _setOptions: function(options){
            this.options = $.extend(true, {
                links: {
                    popupItems: false,
                    popup: false
                },
                size: {
                    width: 800, // define svg canvas width
                    height: 360 // define svg canvas height
                },
                drawDuration: 3000, // define one data line's animation time,
                drawEasing: mina.linear, // define one data line's animation time
                padding: {
                    top: 20, // define svg padding-top
                    right: 5, // define svg padding-right
                    bottom: 30, // define svg padding-bottom
                    left: 40 // define svg padding-left
                },
                hiddenStatusClassName: 'is-hide',

                showHorizontalGrid: true, // showGrid is true, horizontal grid lines will be showed, or they will be hidden.
                horizontalAllLabels: [], // [] or function(){}
                horizontalLabels: [], // [] or function(){}
                
                showVerticalGrid: false,
                verticalValueMin: 0, // define vertical min data
                verticalValueMax: 2.2, // define vertical max data
                verticalValueUnit: 0.2, // define vertical one unit data
                verticalLabels: [], // [] or function(){}

                style: {
                    horizontalLabel: { // define horizontal labels style
                        'fill': '#56646D',
                        'font-family': 'Arial',
                        'font-size': 14,
                        'text-anchor': 'middle',
                        'dominant-baseline': 'text-before-edge'
                    },
                    horizontalFirstLabel: {
                        'text-anchor':'start'
                    },
                    horizontalLastLabel: {
                        'text-anchor': 'end'
                    },
                    verticalLabel: { // define vertical labels style
                        'fill': '#56646D',
                        'font-family': 'Arial',
                        'font-size': 14,
                        'text-anchor':'end',
                        'dominant-baseline':'middle'
                    },
                    gridLine: { // define grid lines style
                        'fill': 'none',
                        'stroke': '#E3E3E3',
                        'stroke-width': 1
                    },
                    firstGridLine: {
                        'stroke': '#56646D'
                    },
                    defaultDataLine: { // define data line default style
                        'fill': 'none',
                        'stroke': '#000', // this would be replaced by data.color
                        'stroke-width': 2
                    }
                },
                callbacks: {
                    init: function(){},
                    destroy: function(){},
                    mousemove: function(index){},
                    beforeOpenPopup: function(popup, index){
                        /**
                        ** popup = this.popup
                        ** index = this.popup.data(this.options.lineIndexDataName)
                        **/
                        var i;
                        this.popup
                            .find('.cool-chart-popup-title')
                            .html(this.options.horizontalAllLabels[index]);
                        for(i = 0; i < this.options.datas.length; i++){
                            this.popupItems.eq(i)
                                .find('.item-data')
                                .html(this.options.datas[i].value[index]);
                        }
                        // need to return true, if return false, program will stop
                        return true;
                    },
                    afterOpenPopup: function(popup, index){},
                    beforeClosePopup: function(popup, index){
                        // need to return true, if return false, program will stop
                        return true;
                    },
                    afterClosePopup: function(popup, index){},
                    beforeHideDataLine: function(index, line, data){
                        // need to return true, if return false, program will stop
                        return true;
                    },
                    afterHideDataLine: function(index, line, data){},
                    beforeHideDataLines: function(){
                        // need to return true, if return false, program will stop
                        return true;
                    },
                    afterHideDataLines: function(){},
                    beforeShowDataLine: function(index, line, data){
                        // need to return true, if return false, program will stop
                        return true;
                    },
                    afterShowDataLine: function(index, line, data){},
                    beforeShowDataLines: function(){
                        // need to return true, if return false, program will stop
                        return true;
                    },
                    afterShowDataLines: function(){},
                    beforeUpdate: function(){
                        // need to return true, if return false, program will stop
                        return true;
                    },
                    afterUpdate: function(){}
                }
            }, options);
            
            if(this.options.datas === undefined || this.options.datas.length === 0){
                return false;
            }

            for(var i = 0; i < this.options.datas.length; i++){
                if(checkData.isFunction(this.options.datas[i].value)){
                    this.options.datas[i].value = this.options.datas[i].value.apply(this.options, arguments);
                }
            }

            if(checkData.isFunction(this.options.horizontalAllLabels)){
                this.options.horizontalAllLabels = this.options.horizontalAllLabels.apply(this.options, arguments);
            }

            if(checkData.isFunction(this.options.horizontalLabels)){
                this.options.horizontalLabels = this.options.horizontalLabels.apply(this.options, arguments);
            }

            if(checkData.isFunction(this.options.verticalLabels)){
                this.options.verticalLabels = this.options.verticalLabels.apply(this.options, arguments);
            }
        },
        _setMarksColor: function(){
            var self = this, index, items = $();

            if(this.items !== undefined){
                items = this.items;
                items.each(function(){
                    index = $(this).data(self.options.dataIndexName);
                    $(this).find(self.options.links.mark).css({
                        'border-color': self.options.datas[index].color
                    });
                });
            }
            if(this.items !== undefined && this.popupItems !== undefined){
                items = items.add(this.popupItems);
                items.each(function(){
                    index = $(this).data(self.options.dataIndexName);
                    $(this).find(self.options.links.mark).css({
                        'background-color': self.options.datas[index].color
                    });
                });
            }
        },
        _setDataLinePoints: function(index){
            var i, points,
                data = this.options.datas[index],
                horizontalPoints = [];

            points = [];
            for(i = 0; i < data.value.length; i++){
                points[i] = {
                    x: (this.gridSize.horizontal * i + this.options.padding.left).toNumberic(2),
                    y: (this.options.size.height - this.gridSize.vertical * (parseFloat(data.value[i]) / this.options.verticalValueUnit) - this.options.padding.bottom).toNumberic(2)
                };
            }

            this.dataLinesPoints[index] = points;
        },
        _setDataLinesPoints: function(){
            var i;

            this.dataLinesPoints = [];
            for(i = 0; i < this.options.datas.length; i++){
                this._setDataLinePoints(i);
            }
        },
        _drawLabels: function(){
            var i, point = {}, HL = this.options.horizontalLabels, index;

            this.svgLabels = {
                horizontal: [],
                vertical: []
            };

            // horizontal labels
            point.y = this.options.size.height - this.options.padding.bottom + 5;
            for(i = 0; i < HL.length; i++){
                index = HL[i].index;
                point.x = this.dataLinesPoints[0][index].x;
                this.svgLabels.horizontal[i] = this.snap.text(point.x, point.y, HL[i].label).attr(this.options.style.horizontalLabel);

                if(index === 0){
                    this.svgLabels.horizontal[i].attr(this.options.style.horizontalFirstLabel);
                }
                if(i === HL.length - 1){
                    this.svgLabels.horizontal[i].attr(this.options.style.horizontalLastLabel);
                }
            }

            // vertical labels
            point.x = this.options.padding.left;
            for(i = 0; i < this.options.verticalLabels.length; i++){
                point.y = this.options.size.height - this.gridSize.vertical * (this.options.verticalLabels[i] / this.options.verticalValueUnit) - this.options.padding.bottom;
                
                this.svgLabels.vertical[i] = this.snap.text(point.x - 5, point.y, this.options.verticalLabels[i]).attr(this.options.style.verticalLabel);
            }
        },
        _drawGrid: function(){
            var i, point = {}, path;

            this.svgGridLines = {
                horizontal: [],
                vertical: []
            };

            // horizontal grid lines
            if(this.options.showHorizontalGrid){
                point.x = this.options.padding.left;
                for(i = 0; i < (this.options.verticalValueMax / this.options.verticalValueUnit + 1); i++){
                    point.y = this.options.size.height - this.gridSize.vertical * i - this.options.padding.bottom;
                    
                    path = svgPathMethods.points([
                        [point.x, point.y],
                        [this.options.size.width - this.options.padding.right, point.y]
                    ]);
                    this.svgGridLines.horizontal[i] = this.snap.path(path).attr(this.options.style.gridLine);
                    if(i === 0){
                        this.svgGridLines.horizontal[i].attr(this.options.style.firstGridLine);
                    }
                }
            }

            // vertical grid lines
            if(this.options.showVerticalGrid){
                point.y = this.options.padding.top;
                for(i = 0; i < (this.options.horizontalValueMax / this.options.horizontalValueUnit); i++){
                    point.x = this.options.padding.left + this.gridSize.horizontal * i;

                    path = svgPathMethods.points([
                        [point.x, point.y],
                        [point.x, this.options.size.height - this.options.padding.bottom]
                    ]);
                    this.svgGridLines.vertical[i] = this.snap.path(path).attr(this.options.style.gridLine);
                }
            }
        },
        _drawAxisAndCrossPoints: function(){
            var path = svgPathMethods.points([
                    [this.options.padding.left, this.options.padding.top],
                    [this.options.padding.left, this.options.size.height - this.options.padding.bottom]
                ]);

            this.axis = this.snap.path(path).attr(this.options.style.gridLine).attr({
                'stroke': '#BFBFBF',
                'stroke-width': 0
            });

            this.crossPoints = [];
            for(var i = 0; i < this.options.datas.length; i++){
                 this.crossPoints[i] = this.snap.circle(0, 0, 3.5).attr({
                    fill:  'none',
                    strokeWidth: 0
                });
            }
        },
        _drawDataLine: function(index){
            if(index >= this.options.datas.length) return false;

            var dataLinePoints = this.dataLinesPoints[index],
                line, tempLine = '', i, self = this, pathLength;

            for(i = 0; i < dataLinePoints.length; i++){
                tempLine = svgPathMethods.point(dataLinePoints[i].x, dataLinePoints[i].y, tempLine);
            }

            if(this.svgDataLines[index] !== undefined){
                line = this.svgDataLines[index].attr({
                    d: tempLine
                });
            }else{
                line = this.snap.path(tempLine).attr(this.options.style.defaultDataLine).attr({
                    'stroke': this.options.datas[index].color
                });
            }
            this.svgDataLines[index] = line;
            this.hideDataLine(index);
        },
        _drawDataLines: function(){
            var self = this, i;

            for(i = 0; i < this.options.datas.length; i++){
                this._drawDataLine(i);
            }
        },
        _triggerFunction: function(){
            var self = this;

            // toggle lines
            this.items
                .off('click' + this.eventNamespace)
                .on('click' + this.eventNamespace, function(){
                    if(self.isDrawing) return false;

                    var index = $(this).data(self.options.dataIndexName);

                    if($(this).hasClass(self.options.hiddenStatusClassName)){
                        if(self.options.callbacks.beforeShowDataLine.apply(self, [index]) === false) return false;

                        $(this).removeClass(self.options.hiddenStatusClassName);

                        self.showDataLine(index);
                        self.svgDataLines[index].removeClass(self.options.hiddenStatusClassName);

                        if(self.popupItems !== undefined){
                            self.popupItems.eq(index).removeClass(self.options.hiddenStatusClassName);
                        }

                        self.options.callbacks.afterShowDataLine.apply(self, [index]);
                    }else{
                        if(self.options.callbacks.beforeHideDataLine.apply(self, [index]) === false) return false;

                        $(this).addClass(self.options.hiddenStatusClassName);

                        self.hideDataLine(index);
                        self.svgDataLines[index].addClass(self.options.hiddenStatusClassName);
                        
                        if(self.popupItems !== undefined){
                            self.popupItems.eq(index).addClass(self.options.hiddenStatusClassName);
                        }

                        self.options.callbacks.afterHideDataLine.apply(self, [index]);
                    }
                });

            // mouse move and show popup, axis, cross points
            this.element
                .off('mousemove' + this.eventNamespace)
                .on('mousemove' + this.eventNamespace, function(e){
                    if(self.isDrawing) return false;

                    if(
                        e.offsetX < self.options.padding.left ||
                        e.offsetX > self.options.size.width - self.options.padding.right ||
                        e.offsetY > self.options.size.height - self.options.padding.bottom ||
                        e.offsetY < self.options.padding.top
                    ){
                        self.closePopup();
                        return false;
                    }

                    var index = ((e.offsetX - self.options.padding.left) / self.gridSize.horizontal).toNumberic();

                    self.openPopup(index);

                    self.options.callbacks.mousemove.apply(self, [index]);
                })
                .off('mouseleave' + this.eventNamespace)
                .on('mouseleave' + this.eventNamespace, function(){
                    self.closePopup();
                });
            if(this.popup !== undefined){
                this.popup
                    .off('mouseenter' + this.eventNamespace)
                    .on('mouseenter' + this.eventNamespace, function(){
                        self.openPopup($(this).data(self.options.dataIndexName));
                    })
                    .off('mouseleave' + this.eventNamespace)
                    .on('mouseleave' + this.eventNamespace, function(){
                        self.closePopup();
                    });
            }
        },

        showDataLine: function(index, callback){
            var self = this,
                line = this.svgDataLines[index];

            this.isDrawing = true;

            if(this.options.callbacks.beforeShowDataLine.apply(this, [index, line, this.options.datas[index]]) === false){
                return false;
            }

            line.animate({
                strokeDashoffset: 0
            }, this.options.drawDuration / this.options.datas.length, this.options.drawEasing, function(){
                self.isDrawing = false;

                self.options.callbacks.afterShowDataLine.apply(self, [index, line, self.options.datas[index]]);

                if(checkData.isFunction(callback)){
                    callback.apply(self, arguments);
                }
            });
        },
        showDataLines: function(index, callback){
            if(index === undefined){
                if(this.options.callbacks.beforeShowDataLines.apply(this, arguments) === false) return false;
                index = 0;
            }
            if(index >= this.options.datas.length){
                this.options.callbacks.afterShowDataLines.apply(this, arguments);
                if(checkData.isFunction(callback)){
                    callback.apply(this, arguments);
                }
                return false;
            }

            var self = this;

            this.showDataLine(index, function(){
                self.showDataLines(index + 1, callback);
            });
        },
        hideDataLine: function(index, callback){
            var line = this.svgDataLines[index],
                pathLength;

            if(this.options.callbacks.beforeHideDataLine.apply(this, [index, line, this.options.datas[index]]) === false){
                return false;
            }

            pathLength = svgPathMethods.pathLength(line);

            line.attr({
                strokeDashoffset: pathLength,
                strokeDasharray: pathLength
            });

            this.options.callbacks.afterHideDataLine.apply(self, [index, line, this.options.datas[index]]);

            if(checkData.isFunction(callback)){
                callback.apply(this, arguments);
            }
        },
        hideDataLines: function(index, callback){
            if(index === undefined){
                if(this.options.callbacks.beforeHideDataLines.apply(this, arguments) === false) return false;
                index = 0;
            }
            if(index >= this.options.datas.length){
                this.options.callbacks.afterHideDataLines.apply(this, arguments);
                if(checkData.isFunction(callback)){
                    callback.apply(this, arguments);
                }
                return false;
            }
            
            var self = this;

            this.hideDataLine(ndex, function(){
                self.beforeHideDataLines(index + 1, callback);
            });
        },
        openPopup: function(index, callback){
            if(this.popup === undefined) return false;
            
            var i, maxPos = false, point,
                x = this.dataLinesPoints[0][index].x,
                path = svgPathMethods.points([
                    [x, this.options.padding.top],
                    [x, this.options.size.height - this.options.padding.bottom]
                ]);

            this.axis.attr({
                'd': path,
                'stroke-width': 1
            });

            var isAllHidden = 0;
            for(i = 0; i < this.options.datas.length; i++){
                if(this.svgDataLines[i].hasClass(this.options.hiddenStatusClassName)){
                    isAllHidden++;
                    continue;
                }
                point = this.dataLinesPoints[i][index];
                this.crossPoints[i].attr({
                    cx: point.x,
                    cy: point.y,
                    fill: this.options.datas[i].color
                });
                if(maxPos === false){
                    maxPos = point.y;
                }else{
                    maxPos = Math.min(maxPos, point.y);
                }
            }

            if(isAllHidden === this.options.datas.length) return false;

            if(this.options.callbacks.beforeOpenPopup.apply(this, [this.popup, index, this.options.datas[index]]) === false) return false;
            
            point = {
                x: this.element[0].offsetLeft + x  - this.popup.outerWidth() / 2,
                y: this.element[0].offsetTop + maxPos - this.popup.outerHeight() - 20
            };

            this.popup
                .data(this.options.dataIndexName, index)
                .show()
                .css({
                    left: point.x,
                    top: point.y,
                    position: 'absolute'
                });

            this.options.callbacks.afterOpenPopup.apply(this, [this.popup, index, this.options.datas[index]]);
            
            if(checkData.isFunction(callback)){
                callback.apply(this, [this.popup, index, this.options.datas[index]]);
            }
        },
        closePopup: function(callback){
            if(this.popup === undefined) return false;
            
            var index = this.popup.data(this.options.lineIndexDataName), i;

            if(this.options.callbacks.beforeClosePopup.apply(this, [this.popup, index, this.options.datas[index]]) === false) return false;
            this.popup
                .hide()
                .removeStyleCss('left')
                .removeStyleCss('top')
                .removeStyleCss('position');
            this.axis.attr({
                'stroke-width': 0
            });
            for(i = 0; i < this.options.datas.length; i++){
                this.crossPoints[i].attr({
                    fill: 'none'
                });
            }
            this.options.callbacks.afterClosePopup.apply(this, [this.popup, index, this.options.datas[index]]);
            
            if(checkData.isFunction(callback)){
                callback.apply(this, [this.popup, index, this.options.datas[index]]);
            }
        },
        update: function(data, index, callback){
            var self = this;
            
            if(this.options.callbacks.beforeUpdate(this, [index, this.svgDataLines[index], this.options.datas[index]]) === false) return false;
            
            if(data.value !== undefined){
                if(checkData.isFunction(data.value)){
                    data.value = data.value.apply(this.options, arguments);
                }
                this.options.datas[index].value = data.value;

                this._setDataLinePoints(index);
                this._drawDataLine(index);
                this.showDataLine(index, function(){
                    self.options.callbacks.afterUpdate(self, [index, self.svgDataLines[index], self.options.datas[index]]);
                    if(checkData.isFunction(callback)){
                        callback.apply(self, [index, self.svgDataLines[index], self.options.datas[index]]);
                    }
                });
            }
            if(data.color !== undefined){
                this.options.datas[index].color = data.color;
                this.svgDataLines[index].attr({
                    stroke: data.color
                });
                if(this.items !== undefined){
                    this.items.eq(index).find(this.options.links.mark).css({
                        'background-color': data.color,
                        'border-color': data.color
                    });
                }
                if(this.popupItems !== undefined){
                    this.popupItems.eq(index).find(this.options.links.mark).css({
                        'background-color': data.color
                    });
                }
                this.options.callbacks.afterUpdate(this, [index, this.svgDataLines[index], this.options.datas[index]]);
                if(checkData.isFunction(callback)){
                    callback.apply(this, [index, this.svgDataLines[index], this.options.datas[index]]);
                }
            }
        },
        destroy: function($super){
            $super();

            this.options.callbacks.destroy.apply(this, arguments);
        }
    });

    var RectChart = Class(Chart, {
        init: function($super, element, options){
            if($super(element, options) === false) return false;
            
            this.snap = Snap(this.element[0]).attr({
                width: this.options.size.width,
                height: this.options.size.height
            });

            if(this.options.links.items !== false){
                this.items = $(this.options.links.items);
            }

            if(this.options.links.popup !== false){
                this.popup = $(this.options.links.popup);
                if(this.options.links.popupItems !== false){
                    this.popupItems = this.popup.find(this.options.links.popupItems);
                }
            }

            this.canvasSize = {
                width: this.options.size.width - this.options.padding.left - this.options.padding.right,
                height: this.options.size.height - this.options.padding.top - this.options.padding.bottom
            };

            this.gridWidth = ((this.canvasSize.width - (this.options.datas[0].value.length - 1) * this.options.gapBetweenRects) / this.options.datas[0].value.length).toNumberic(2);
            this.columnsPosition = [];
            var i;
            for(i = 0; i < this.options.datas[0].value.length; i++){
                this.columnsPosition[i] = (i * (this.options.gapBetweenRects + this.gridWidth)).toNumberic(2);
            }

            this._setMarksColor();

            this._drawHorizontalLabels();
            
            this._drawAllRects();
            
            this._drawLine();
            
            this.showRects(function(){
                this.showLine();
            });
            
            this._triggerFunction();
        },
        _setOptions: function(options){
            this.options = $.extend(true, {
                links: {
                    popup: false,
                    popupItems: false
                },
                size: {
                    width: 720,
                    height: 220
                },
                drawDuration: 2000,
                drawEasing: mina.bounce,
                padding: {
                    top: 0,
                    right: 0,
                    bottom: 20,
                    left: 0
                },
                hiddenStatusClassName: 'is-hide',
                gapBetweenRects: function(){
                    var len = this.datas[0].value.length;
                    if(len > 20 && len <= 35){
                        return 8;
                    }else if(len > 10 && len <= 20){
                        return 12;
                    }else if(len > 5 && len <= 10){
                        return 16;
                    }else if(len > 3 && len <= 5){
                        return 50;
                    }else if(len > 1 && len <= 3){
                        return 100;
                    }else{
                        return 16;
                    }
                },
                gapBetweenSubRects: 2,
                
                horizontalAllLabels: [], // [] or function(){}
                horizontalLabels: [], // [] or function(){}

                style: {
                    horizontalLabel: {
                        'fill': '#56646D',
                        'font-family': 'Arial',
                        'font-size': '12px',
                        'text-anchor': 'middle',
                        'dominant-baseline': 'text-before-edge'
                    },
                    rect: {
                        fill: '#000',
                        stroke: 'none',
                        strokeWidth: 0
                    },
                    defaultDataLine: {
                        'fill': 'none',
                        'stroke': '#f00',
                        'strokeWidth': 3,
                    },
                    pointCircle: {
                        'fill': '#FFD400',
                        'stroke': '#FF5969',
                        'strokeWidth': 3
                    }
                },
                callbacks: {
                    init: function(){},
                    destroy: function(){},
                    beforeOpenPopup: function(index, popup){},
                    afterOpenPopup: function(index, popup){},
                    beforeClosePopup: function(index, popup){},
                    afterClosePopup: function(index, popup){},
                    beforeDrawSubRect: function(){},
                    afterDrawSubRect: function(){},
                    beforeDrawRect: function(){},
                    afterDrawRect: function(){},
                    mouseover: function(){}
                }
            }, options);
            
            if(this.options.datas === undefined || this.options.datas.length === 0){
                return false;
            }

            for(var i = 0; i < this.options.datas.length; i++){
                if(checkData.isFunction(this.options.datas[i].value)){
                    this.options.datas[i].value = this.options.datas[i].value.apply(this.options, arguments);
                }
            }

            if(checkData.isFunction(this.options.datas)){
                this.options.datas = this.options.datas.apply(this.options, arguments);
            }

            if(checkData.isFunction(this.options.horizontalAllLabels)){
                this.options.horizontalAllLabels = this.options.horizontalAllLabels.apply(this.options, arguments);
            }

            if(checkData.isFunction(this.options.horizontalLabels)){
                this.options.horizontalLabels = this.options.horizontalLabels.apply(this.options, arguments);
            }

            if(checkData.isFunction(this.options.gapBetweenRects)){
                this.options.gapBetweenRects = this.options.gapBetweenRects.apply(this.options, arguments);
            }
        },
        _setMarksColor: function(){
            var self = this, index, items = $();

            if(this.items !== undefined){
                items = this.items;
                items.each(function(){
                    index = $(this).data(self.options.dataIndexName);
                    $(this).find(self.options.links.mark).css({
                        'border-color': index >= self.options.datas.length ? self.options.lineData.color : self.options.datas[index].color
                    });
                });
            }
            if(this.items !== undefined && this.popupItems !== undefined){
                items = items.add(this.popupItems);
                items.each(function(){
                    index = $(this).data(self.options.dataIndexName);
                    $(this).find(self.options.links.mark).css({
                        'background-color': index >= self.options.datas.length ? self.options.lineData.color : self.options.datas[index].color
                    });
                });
            }
        },
        _drawHorizontalLabels: function(){
            var g = this.snap.paper.g().attr({class: 'cool-chart-x-label'}), xl, i, label;
            
            for(i = 0; i < this.options.horizontalLabels.length; i++){
                label = this.options.horizontalLabels[i];
                xl = this.snap.text(this.columnsPosition[label.index] + (this.gridWidth / 2).toNumberic(2), this.canvasSize.height + 5, label.label).attr(this.options.style.horizontalLabel);
                g.add(xl);
            }
        },        
        _drawAllRects: function(){
            var i, m, datas, g;
            
            this.rects = [];
            
            for(i = 0; i < this.options.datas[0].value.length; i++){
                datas = this._getRectsDatas(i);
                this.rects[i] = [];
                g = this.snap.paper.g().attr({class: 'cool-chart-rect-group cool-chart-rect-group-' + i}).data('index', i);
                for(m = 0; m < datas.length; m++){
                    this.rects[i][m] = this.snap.rect(datas[m].x, (this.canvasSize.height - datas[m].y), datas[m].width, 0).attr(this.options.style.rect).attr({
                        class: 'cool-chart-rect cool-chart-rect-' + i + '-' + m,
                        fill: datas[m].color
                    }).data('index', i).data('subRectIndex', m);
                    
                    g.add(this.rects[i][m]);
                }
            }
        },
        _drawLine: function(){
            var i, line, m = 0, tempLine = '', pathLength, x, y;
            
            this.balanceLinePoints = [];
            
            for(i = 0; i < this.options.lineData.value.length; i++){
                x = Math.ceil(this.columnsPosition[i] + this.gridWidth / 2);
                
                this.balanceLinePoints[i] = x;
                
                if(i > 0 && i < this.options.lineData.value.length - 1){
                    continue;
                }
                
                y = Math.ceil(this.canvasSize.height - this.options.lineData.value[i] * this.canvasSize.height);
                if(i === 0){
                    tempLine = svgPathMethods.point(x - 5, y + 5, tempLine);
                }else{
                    tempLine = svgPathMethods.point(x + 5, y - 5, tempLine, x * 0.65, y * 0.1);
                }
            }
            
            if(this.balanceLine !== undefined){
                line = this.balanceLine.attr({
                    d: tempLine
                });
            }else{
                line = this.snap.path(tempLine).attr(this.options.style.defaultDataLine).attr({
                    class: 'cool-chart-line',
                    'stroke': '#FF5969'
                });
            }
            
            pathLength = svgPathMethods.pathLength(line);
            line.attr({
                'strokeDashoffset': pathLength,
                'strokeDasharray': pathLength
            });

            this.balanceLine = line;
            
            this.pointCircle = this.snap.circle(0,0,4).attr(this.options.style.pointCircle).attr({
                'opacity': 0
            });
            this.hoverLine = this.snap.path(svgPathMethods.points([[0,0],[0,this.canvasSize.height]])).attr({
                'fill': 'none',
                'stroke': 'none',
                'strokeWidth': 1
            });
        },
        _triggerFunction: function(){
            var self = this, index, i, m, point;

            for(i = 0; i < this.rects.length; i++){
                for(m = 0; m < this.rects[i].length; m++){
                    this.rects[i][m]
                        .unmouseout()
                        .mouseover(function(){
                            if(self.isDrawing) return false;

                            index = this.data('index');
                            self.openPopup(index);
                        });
                }
            }
            this.element
                .off('mouseout' + this.eventNamespace)
                .on('mouseout' + this.eventNamespace, function(){
                    self.closePopup();
                });
            this.items
                .off('click' + this.eventNamespace)
                .on('click' + this.eventNamespace, function(){
                    index = $(this).data(self.options.dataIndexName);

                    if($(this).hasClass(self.options.hiddenStatusClassName)){
                        $(this).removeClass(self.options.hiddenStatusClassName);
                        if(index >= self.options.datas.length){
                            self.showLine();
                        }else{
                            self.showSubRects(index);
                        }
                    }else{
                        $(this).addClass(self.options.hiddenStatusClassName);
                        if(index >= self.options.datas.length){
                            self.hideLine();
                        }else{
                            self.hideSubRects(index);
                        }
                    }
                });
        },
        _getRectsDatas: function(index){
            var datas = [], i, basicHeight = 0, height = 0;
            for(i = 0; i < this.options.datas.length; i++){
                height = (this.options.datas[i].value[index] * this.canvasSize.height).toNumberic(2) + this.options.gapBetweenSubRects;
                datas[i] = {
                    value: this.options.datas[i].value[index],
                    color: this.options.datas[i].color,
                    height: height,
                    width: this.gridWidth,
                    x: this.columnsPosition[index],
                    y: basicHeight
                };
                basicHeight += height + this.options.gapBetweenSubRects;
            }
            return datas;
        },
        
        showSubRect: function(index, subRectIndex, datas, callback, isLast){
            if(index === undefined || subRectIndex === undefined){
                console.log('Warning: Please define argument "index" and "subRectIndex"!');
                return false;
            }
            if(datas === undefined){
                datas = this._getRectsDatas(index);
            }
            if(subRectIndex === datas.length){
                return false;
            }

            this.isDrawing = true;
            
            var self = this;

            this.rects[index][subRectIndex].animate({
                y: this.canvasSize.height - datas[subRectIndex].y - datas[subRectIndex].height,
                height: datas[subRectIndex].height
            }, this.options.drawDuration * datas[subRectIndex].value, this.options.drawEasing, function(){
                self.isDrawing = false;

                if(checkData.isFunction(callback)){
                    callback.apply(self, isLast ? [subRectIndex, self.options.datas[0].value.length] : [index, subRectIndex, datas]);
                }
            });
        },
        showRect: function(index, subRectIndex, datas, callback, isLast){
            if(index === undefined){
                console.log('Warning: Please define argument "index"!');
                return false;
            }
            if(subRectIndex === undefined){
                subRectIndex = 0;
            }
            if(datas === undefined){
                datas = this._getRectsDatas(index);
            }
            if(subRectIndex === datas.length){
                if(checkData.isFunction(callback)){
                    callback.apply(this, isLast ? [this.options.datas[0].value.length] : [index, datas]);
                }
                return false;
            }

            var self = this;

            this.showSubRect(index, subRectIndex, datas, function(index, subRectIndex, datas){
                this.showRect(index, subRectIndex + 1, datas, callback, isLast);
            });
        },
        showRects: function(callback){
            var i;
            
            for(i = 0; i < this.options.datas[0].value.length; i++){
                if(i === this.options.datas[0].value.length - 1){
                    this.showRect(i, undefined, undefined, callback, true);
                }else{
                    this.showRect(i);
                }
            }
        },
        showSubRects: function(index, callback){
            if(index === undefined){
                console.log('Warning: Please define argument "index"!');
                return false;
            }

            var i;

            for(i = 0; i < this.options.datas[0].value.length; i++){
                if(i === this.options.datas[0].value.length - 1){
                    this.showSubRect(i, index, undefined, callback, true);
                }else{
                    this.showSubRect(i, index);
                }
            }
        },

        hideSubRect: function(index, subRectIndex, datas, callback, isLast){
            if(index === undefined || subRectIndex === undefined){
                console.log('Warning: Please define argument "index" and "subRectIndex"!');
                return false;
            }
            if(datas === undefined){
                datas = this._getRectsDatas(index);
            }
            if(subRectIndex === datas.length){
                return false;
            }
            
            this.rects[index][subRectIndex].attr({
                y: this.canvasSize.height - datas[subRectIndex].y,
                height: 0
            });
            
            if(checkData.isFunction(callback)){
                callback.apply(this, isLast ? [subRectIndex, self.options.datas[0].value.length] : [index, subRectIndex, datas]);
            }
        },
        hideRect: function(index, subRectIndex, datas, callback, isLast){
            if(index === undefined){
                console.log('Warning: Please define argument "index"!');
                return false;
            }
            if(subRectIndex === undefined){
                subRectIndex = 0;
            }
            if(datas === undefined){
                datas = this._getRectsDatas(index);
            }
            if(subRectIndex === datas.length){
                if(checkData.isFunction(callback)){
                    callback.apply(this, isLast ? [this.options.datas[0].value.length] : [index, datas]);
                }
                return false;
            }
            
            var self = this;

            this.hideSubRect(index, subRectIndex, datas, function(index, subRectIndex, datas){
                this.hideRect(index, subRectIndex + 1, datas, callback, isLast);
            });
        },
        hideRects: function(callback){
            var i;
            
            for(i = 0; i < this.options.datas[0].value.length; i++){
                if(i === this.options.datas[0].value.length - 1){
                    this.hideRect(i, undefined, undefined, callback, true);
                }else{
                    this.hideRect(i);
                }
            }
        },
        hideSubRects: function(index, callback){
            if(index === undefined){
                console.log('Warning: Please define argument "index"!');
                return false;
            }

            var i;

            for(i = 0; i < this.options.datas[0].value.length; i++){
                if(i === this.options.datas[0].value.length - 1){
                    this.hideSubRect(i, index, undefined, callback, true);
                }else{
                    this.hideSubRect(i, index);
                }
            }
        },

        showLine: function(callback){
            var self = this;

            this.isDrawing = true;
            
            this.balanceLine.animate({
                'strokeDashoffset': 0
            }, 500, mina.linear, function(){

                self.isDrawing = false;

                if(checkData.isFunction(callback)){
                    callback.apply(self, arguments);
                }
            });
        },
        hideLine: function(callback){
            var pathLength;
            
            pathLength = svgPathMethods.pathLength(this.balanceLine);
            
            this.balanceLine.attr({
                'strokeDasharray': pathLength,
                'strokeDashoffset': pathLength
            });
            
            if(checkData.isFunction(callback)){
                callback.apply(this, arguments);
            }
        },
        openPopup: function(index){
            if(this.popup === undefined) return false;

            var point;

            this.hoverLine.attr({
                d: svgPathMethods.points([[this.balanceLinePoints[index],0], [this.balanceLinePoints[index],this.canvasSize.height]])
            });

            point = Snap.path.intersection(this.hoverLine, this.balanceLine);
            point = point[0];

            this.pointCircle.attr({
                opacity: 1,
                cx: point.x,
                cy: point.y
            });

            this.popup
                .show()
                .css({
                    'left': this.element[0].offsetLeft + (this.balanceLinePoints[index] - this.popup.innerWidth() / 2),
                    'top': this.element[0].offsetTop - this.popup.innerHeight() - 10,
                    'position': 'absolute'
                });
        },
        closePopup: function(){
            if(this.popup === undefined) return false;

            this.popup
                .hide()
                .removeStyleCss('left')
                .removeStyleCss('top')
                .removeStyleCss('position');
            this.pointCircle.attr({
                'opacity': 0
            });
        },
        update: function(){},
        destroy: function($super){
            $super();

            this.options.callbacks.destroy.apply(this, arguments);
        }
    });

    $.fn.kdCoolChart = function(options){
        options = $.extend(true, {
            dataIndexName: 'coolChartIndex',
            type: 'full-pie', // full-pie, half-pie, line, rect
            links: {
                mark: '.cool-chart-data-mark',
                items: false
            },
            datas: [],
        }, options);

        return this.each(function(){
            var cc;
            switch(options.type){
                case 'full-pie':
                case 'half-pie': cc = new PieChart(this, options); break;
                case 'line': cc = new LineChart(this, options); break;
                case 'rect': cc = new RectChart(this, options); break;
                default: console.log('Warning: Please set this.options.type!'); return false;
            }
            $(this).data('kdCoolChart', cc);
        });
    };
}(window, jQuery));
