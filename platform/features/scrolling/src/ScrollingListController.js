/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,Promise*/

/**
 * Module defining ListController. Created by vwoeltje on 11/18/14.
 */
define(
    ["./NameColumn", "./DomainColumn", "./RangeColumn", "./ScrollingListPopulator"],
    function (NameColumn, DomainColumn, RangeColumn, ScrollingListPopulator) {
        "use strict";

        var ROW_COUNT = 18;

        /**
         * The ScrollingListController is responsible for populating
         * the contents of the scrolling list view.
         * @constructor
         */
        function ScrollingListController($scope, formatter) {
            var populator;


            // Get a set of populated, ready-to-display rows for the
            // latest data values.
            function getRows(telemetry) {
                var datas = telemetry.getResponse(),
                    objects = telemetry.getTelemetryObjects();

                return populator.getRows(datas, objects, ROW_COUNT);
            }

            // Update the contents
            function updateRows() {
                var telemetry = $scope.telemetry;
                $scope.rows = telemetry ? getRows(telemetry) : [];
            }

            // Set up columns based on telemetry metadata. This will
            // include one column for each domain and range type, as
            // well as a column for the domain object name.
            function setupColumns(metadatas) {
                var domainKeys = {},
                    rangeKeys = {},
                    columns = [];

                // Add a domain to the set of columns, if a domain
                // with the same key has not yet been inclued.
                function addDomain(domain) {
                    var key = domain.key;
                    if (key && !domainKeys[key]) {
                        domainKeys[key] = true;
                        columns.push(new DomainColumn(domain, formatter));
                    }
                }

                // Add a range to the set of columns, if a range
                // with the same key has not yet been inclued.
                function addRange(range) {
                    var key = range.key;
                    if (key && !rangeKeys[key]) {
                        rangeKeys[key] = true;
                        columns.push(new RangeColumn(range, formatter));
                    }
                }

                // We cannot proceed if metadata is not available;
                // clear all rows/columns.
                if (!Array.isArray(metadatas)) {
                    columns = [];
                    $scope.rows = [];
                    $scope.headers = [];
                    return;
                }

                columns = [ new NameColumn() ];

                // Add domain, range columns
                metadatas.forEach(function (metadata) {
                    (metadata.domains || []).forEach(addDomain);
                });
                metadatas.forEach(function (metadata) {
                    (metadata.ranges || []).forEach(addRange);
                });

                // Add default domain, range columns if none
                // were described in metadata.
                if (Object.keys(domainKeys).length < 1) {
                    columns.push(new DomainColumn({name: "Time"}, formatter));
                }
                if (Object.keys(rangeKeys).length < 1) {
                    columns.push(new RangeColumn({name: "Value"}, formatter));
                }

                // We have all columns now; use them to initializer
                // the populator, which will use them to generate
                // actual rows and headers.
                populator = new ScrollingListPopulator(columns);

                // Initialize headers
                $scope.headers = populator.getHeaders();

                // Fill in the contents of the rows.
                updateRows();
            }

            $scope.$on("telemetryUpdate", updateRows);
            $scope.$watch("telemetry.getMetadata()", setupColumns);
        }

        return ScrollingListController;
    }
);
